import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Activity, ShieldCheck, Zap, UserRound, KeyRound, Eye, EyeOff,
    RefreshCw, ChevronRight, AlertCircle
} from 'lucide-react';

const roles = [
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Client Admin', value: 'client_admin' },
    { label: 'Client Viewer', value: 'client_viewer' }
];

function Logo({ compact = false }) {
    return (
        <div className="logo">
            <span className="logo-mark">
                <Activity size={18} strokeWidth={2.5} />
            </span>
            {!compact && (
                <span>
                    <strong>Pulse</strong>API
                    <small>API OBSERVABILITY</small>
                </span>
            )}
        </div>
    );
}

export default function Login() {
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState('super_admin');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ username, password });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-brand">
                <div>
                    <Logo />
                    <div className="brand-copy">
                        <p className="eyebrow">API MONITORING & OBSERVABILITY</p>
                        <h1>
                            Monitor every API.<br />
                            <span>Understand every request.</span>
                        </h1>
                        <p>
                            PulseAPI gives engineering teams a clear view of API traffic, latency, errors, endpoints and service performance.
                        </p>
                    </div>
                </div>

                <div className="network-art" aria-hidden="true">
                    <div className="network-grid" />
                    <span className="node node-a" />
                    <span className="node node-b" />
                    <span className="node node-c" />
                    <span className="node node-d" />
                    <span className="node node-e" />
                    <svg viewBox="0 0 540 260">
                        <path d="M45 185 C130 60 180 180 267 102 S390 48 495 110" />
                        <path d="M45 185 C145 220 186 60 267 102 S390 180 495 110" />
                        <path d="M45 185 L267 102 L495 110" />
                    </svg>
                    <div className="art-label label-a">telemetry</div>
                    <div className="art-label label-b">99.98%</div>
                </div>

                <div className="brand-footer">
                    <span><ShieldCheck size={15} /> SOC 2 ready infrastructure</span>
                    <span><Zap size={15} /> Real-time insights</span>
                </div>
            </section>

            <section className="login-panel">
                <div className="login-card">
                    <div className="mobile-logo">
                        <Logo />
                    </div>
                    <p className="eyebrow">WORKSPACE ACCESS</p>
                    <h2>Welcome back</h2>
                    <p className="login-subtitle">Sign in to your PulseAPI workspace</p>

                    <div className="role-picker">
                        <p>Sign in role demo persona</p>
                        <div className="role-options">
                            {roles.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    className={selectedRole === item.value ? 'role-selected' : ''}
                                    onClick={() => setSelectedRole(item.value)}
                                >
                                    <span className="role-radio">
                                        {selectedRole === item.value && <span />}
                                    </span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 12px',
                            background: '#ffe9ea',
                            color: '#d1545c',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertCircle size={15} style={{ flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <label className="field-label" htmlFor="username">Username</label>
                        <div className="input-wrap">
                            <UserRound size={16} />
                            <input
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <label className="field-label" htmlFor="password">Password</label>
                        <div className="input-wrap">
                            <KeyRound size={16} />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="input-action"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="primary-button sign-in"
                            disabled={loading}
                        >
                            {loading ? <RefreshCw className="spin" size={16} /> : null}
                            {loading ? 'Signing in...' : 'Sign in'}
                            {!loading && <ChevronRight size={16} />}
                        </button>
                    </form>

                    <p className="secure-note">
                        <ShieldCheck size={14} /> Secure access · Your workspace is protected
                    </p>
                </div>

                <p className="login-legal">
                    © 2026 PulseAPI, Inc. <span>Privacy</span><span>Terms</span>
                </p>
            </section>
        </main>
    );
}
