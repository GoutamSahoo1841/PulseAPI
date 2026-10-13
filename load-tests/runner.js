import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SERVER_DIR = path.resolve(ROOT_DIR, 'server');
const RESULTS_DIR = path.resolve(__dirname, 'results');

if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Function to find k6 executable path
function getK6Command() {
    const defaultPaths = [
        'k6',
        'k6.exe',
        'C:\\Program Files\\k6\\k6.exe',
        'C:\\Program Files (x86)\\k6\\k6.exe',
    ];
    for (const p of defaultPaths) {
        try {
            return p;
        } catch (_) {}
    }
    return 'k6';
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkHealth(url = 'http://localhost:5000/health') {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

function fetchMetrics(url = 'http://localhost:5000/health/metrics') {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (_) {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
    });
}

async function startServer(envOverrides = {}) {
    console.log('\n[Runner] 🚀 Starting API Monitoring Server...');
    const env = {
        ...process.env,
        RATE_LIMIT_ENABLED: 'false',
        LOG_LEVEL: 'warn',
        PORT: '5000',
        ...envOverrides,
    };

    const serverProcess = spawn('node', ['src/server.js'], {
        cwd: SERVER_DIR,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', (d) => {
        const line = d.toString().trim();
        if (line) console.log(`[Server] ${line}`);
    });
    serverProcess.stderr.on('data', (d) => {
        const line = d.toString().trim();
        if (line) console.error(`[Server Error] ${line}`);
    });

    // Wait up to 30s for server to become healthy
    const startTime = Date.now();
    while (Date.now() - startTime < 30000) {
        await wait(1500);
        const healthy = await checkHealth();
        if (healthy) {
            console.log('[Runner] ✅ Server is healthy and listening on http://localhost:5000');
            return serverProcess;
        }
    }

    serverProcess.kill();
    throw new Error('Server failed to start within 30 seconds');
}

async function runK6(scriptPath, extraArgs = []) {
    const k6Cmd = getK6Command();
    console.log(`\n[Runner] 🧪 Executing k6: ${path.basename(scriptPath)}...`);

    return new Promise((resolve, reject) => {
        const proc = spawn(k6Cmd, ['run', scriptPath, ...extraArgs], {
            cwd: ROOT_DIR,
            stdio: 'inherit',
            shell: true,
        });

        proc.on('close', (code) => {
            if (code === 0) {
                console.log(`[Runner] ✅ k6 execution finished successfully (code 0)`);
                resolve(code);
            } else {
                console.warn(`[Runner] ⚠️ k6 finished with exit code ${code}`);
                resolve(code);
            }
        });

        proc.on('error', (err) => {
            console.error('[Runner] Failed to execute k6:', err);
            reject(err);
        });
    });
}

async function stopServer(serverProcess) {
    if (!serverProcess) return;
    console.log('[Runner] 🛑 Stopping server...');
    return new Promise((resolve) => {
        serverProcess.on('close', () => {
            console.log('[Runner] Server process terminated.');
            resolve();
        });
        serverProcess.kill('SIGINT');
        setTimeout(() => {
            try {
                serverProcess.kill('SIGKILL');
            } catch (_) {}
            resolve();
        }, 5000);
    });
}

// CLI handler
const mode = process.argv[2] || 'smoke';

async function main() {
    try {
        if (mode === 'smoke') {
            const server = await startServer({ ENABLE_API_KEY_CACHE: 'true' });
            try {
                await runK6(path.resolve(__dirname, 'smoke-test.js'));
                const metrics = await fetchMetrics();
                console.log('\n[Runner] System Metrics:', JSON.stringify(metrics?.data?.apiKeyCache || {}, null, 2));
            } finally {
                await stopServer(server);
            }
        } else if (mode === 'benchmark-compare') {
            console.log('\n============================================================');
            console.log(' STEP 1: BENCHMARK WITHOUT LRU CACHE (MongoDB on every request)');
            console.log('============================================================');
            const serverNoCache = await startServer({ ENABLE_API_KEY_CACHE: 'false' });
            try {
                await runK6(path.resolve(__dirname, 'benchmark-cache.js'));
            } finally {
                await stopServer(serverNoCache);
            }

            await wait(3000);

            console.log('\n============================================================');
            console.log(' STEP 2: BENCHMARK WITH 10-MIN TTL LRU CACHE (Optimized)');
            console.log('============================================================');
            const serverWithCache = await startServer({ ENABLE_API_KEY_CACHE: 'true' });
            try {
                await runK6(path.resolve(__dirname, 'benchmark-cache.js'));
                const metrics = await fetchMetrics();
                console.log('\n[Runner] LRU Cache Efficiency Metrics:');
                console.table(metrics?.data?.apiKeyCache || {});
            } finally {
                await stopServer(serverWithCache);
            }
        } else if (mode === 'full') {
            console.log('\n============================================================');
            console.log(' STEP: FULL LOAD TEST (200 Concurrent Users, 5 Minutes)');
            console.log('============================================================');
            const server = await startServer({ ENABLE_API_KEY_CACHE: 'true' });
            try {
                await runK6(path.resolve(__dirname, 'full-load-test.js'));
                const metrics = await fetchMetrics();
                console.log('\n[Runner] Post-Test Pipeline & Cache Metrics:');
                console.log(JSON.stringify(metrics?.data, null, 2));
            } finally {
                await stopServer(server);
            }
        } else {
            console.log(`Unknown mode: ${mode}. Available: smoke | benchmark-compare | full`);
        }
    } catch (err) {
        console.error('[Runner Fatal Error]', err);
        process.exit(1);
    }
}

main();
