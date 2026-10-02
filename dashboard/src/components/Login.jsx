import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ShieldCheck, Building2, Eye, Lock, User, Loader2, Info, ChevronDown, Check } from 'lucide-react';
import styles from '../styles/modules/Login.module.scss';

const USER_ROLES = [
    {
        id: 'super_admin',
        label: 'Super Admin',
        icon: ShieldCheck,
        description: 'Full system management access. Control all organisations, manage users, and view system-wide analytics.',
        badge: 'System Control',
        color: '#a855f7'
    },
    {
        id: 'client_admin',
        label: 'Client Admin',
        icon: Building2,
        description: 'Organisation Administrator. Manage team members, create API keys, and monitor organisation analytics.',
        badge: 'Org Admin',
        color: '#3b82f6'
    },
    {
        id: 'client_viewer',
        label: 'Client Viewer',
        icon: Eye,
        description: 'Read-only Access. Inspect live API metrics, latency charts, and status metrics for your organisation.',
        badge: 'Analytics Only',
        color: '#10b981'
    }
];

function Login() {
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState('super_admin');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const currentRole = USER_ROLES.find(r => r.id === selectedRole) || USER_ROLES[0];
    const RoleIcon = currentRole.icon;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ username, password });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Animated background elements */}
            <div className={styles.backgroundElements}>
                <div className={`${styles.backgroundOrb} ${styles.orb1}`}></div>
                <div className={`${styles.backgroundOrb} ${styles.orb2}`}></div>
                <div className={`${styles.backgroundOrb} ${styles.orb3}`}></div>
            </div>

            <div className={styles.loginCard} style={{ maxWidth: '28rem' }}>
                <div className={styles.cardHeader}>
                    <div className={styles.logoContainer}>
                        <Activity />
                    </div>
                    <h1 className={styles.title}>API Monitor</h1>
                    <p className={styles.description} style={{ color: 'var(--theme-muted-text, #94a3b8)', fontSize: '0.875rem' }}>
                        Sign in to access your API monitoring workspace
                    </p>
                </div>

                <div className={styles.cardContent}>
                    {/* Role Dropdown Selector */}
                    <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            marginBottom: '0.375rem',
                            color: 'hsl(var(--foreground))'
                        }}>
                            Select User Role Persona
                        </label>

                        {/* Custom Dropdown Trigger */}
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.625rem 0.875rem',
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: `1px solid ${currentRole.color}60`,
                                borderRadius: '0.5rem',
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: `0 0 10px ${currentRole.color}20`
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <RoleIcon size={20} style={{ color: currentRole.color }} />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{currentRole.label}</div>
                                    <div style={{ fontSize: '0.75rem', color: currentRole.color, fontWeight: 500 }}>{currentRole.badge}</div>
                                </div>
                            </div>
                            <ChevronDown size={18} style={{
                                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s ease',
                                color: '#94a3b8'
                            }} />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                marginTop: '0.375rem',
                                background: 'var(--theme-glass-strong-bg, #0f172a)',
                                border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.15))',
                                borderRadius: '0.5rem',
                                boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
                                zIndex: 50,
                                overflow: 'hidden',
                                backdropFilter: 'blur(16px)'
                            }}>
                                {USER_ROLES.map((role) => {
                                    const ItemIcon = role.icon;
                                    const isSelected = selectedRole === role.id;
                                    return (
                                        <div
                                            key={role.id}
                                            onClick={() => {
                                                setSelectedRole(role.id);
                                                setDropdownOpen(false);
                                                setError('');
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.75rem 0.875rem',
                                                background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                                transition: 'background 0.15s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                <ItemIcon size={18} style={{ color: role.color }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>{role.label}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{role.badge}</div>
                                                </div>
                                            </div>
                                            {isSelected && <Check size={16} style={{ color: role.color }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Role Info Box */}
                    <div style={{
                        display: 'flex',
                        gap: '0.625rem',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderLeft: `3px solid ${currentRole.color}`,
                        marginBottom: '1.25rem',
                        fontSize: '0.8125rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        lineHeight: 1.4
                    }}>
                        <Info size={16} style={{ color: currentRole.color, flexShrink: 0, marginTop: '2px' }} />
                        <div>{currentRole.description}</div>
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="username" className={styles.label}>
                                Username
                            </label>
                            <div className={styles.inputContainer}>
                                <User />
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                    className={styles.input}
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Password
                            </label>
                            <div className={styles.inputContainer}>
                                <Lock />
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className={styles.input}
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                            style={{
                                background: `linear-gradient(to right, ${currentRole.color}, #6366f1)`
                            }}
                        >
                            <div className={styles.buttonContent}>
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    `Sign In as ${currentRole.label}`
                                )}
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
