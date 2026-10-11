import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongodb from './src/shared/config/mongodb.js';
import postgres from './src/shared/config/postgres.js';
import User from './src/shared/models/User.js';
import logger from './src/shared/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initSystem() {
    console.log('\n🚀 Initializing API Monitoring System Backend...\n');

    // 1. Ensure .env exists
    const envPath = path.join(__dirname, '.env');
    const envExamplePath = path.join(__dirname, '.env.example');

    if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ Created server/.env from .env.example');
    }

    try {
        // 2. Init PostgreSQL database table
        console.log('⏳ Connecting to PostgreSQL and creating schema...');
        await postgres.testConnection();

        const sqlFilePath = path.join(__dirname, 'scripts', 'init-postgres.sql');
        if (fs.existsSync(sqlFilePath)) {
            const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
            await postgres.query(sqlQuery);
            console.log('✅ PostgreSQL table endpoint_metrics initialized successfully');
        }

        // 3. Init MongoDB & Super Admin
        console.log('⏳ Connecting to MongoDB...');
        await mongodb.connect();

        const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
        if (!existingSuperAdmin) {
            const adminUsername = process.env.INITIAL_ADMIN_USERNAME || 'admin';
            const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com';
            const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';

            const superAdmin = new User({
                username: adminUsername,
                email: adminEmail,
                password: adminPassword,
                role: 'super_admin',
                permissions: {
                    canCreateApiKeys: true,
                    canManageUsers: true,
                    canViewAnalytics: true,
                    canExportData: true,
                },
            });
            await superAdmin.save();
            console.log('✅ Super Admin user created successfully!');
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: [Configured]`);
        } else {
            console.log(`✅ Super Admin already exists (${existingSuperAdmin.username})`);
        }

        console.log('\n✨ System initialization complete!\n');
    } catch (error) {
        console.error('❌ Error during system initialization:', error.message);
    } finally {
        try {
            await mongodb.disconnect();
            await postgres.close();
        } catch (_) {}
        process.exit(0);
    }
}

initSystem();
