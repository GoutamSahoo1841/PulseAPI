import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Building2,
    Users,
    Key,
    Settings,
    Zap,
    ShieldCheck,
    Eye
} from 'lucide-react';
import styles from '../../styles/modules/layout/Sidebar.module.scss';

export function Sidebar({ isOpen, onClose }) {
    const { user, isSuperAdmin, isClientAdmin, role } = useAuth();

    const navItems = [
        {
            title: 'Analytics Overview',
            href: '/',
            icon: LayoutDashboard,
            show: true
        },
        {
            title: 'Organisations',
            href: '/organisations',
            icon: Building2,
            show: isSuperAdmin
        },
        {
            title: isSuperAdmin ? 'System Users' : 'Team Members',
            href: '/users',
            icon: Users,
            show: isSuperAdmin || isClientAdmin
        },
        {
            title: 'API Ingestion Keys',
            href: '/api-keys',
            icon: Key,
            show: isSuperAdmin || isClientAdmin
        }
    ].filter(item => item.show);

    const bottomNavItems = [
        {
            title: 'Settings',
            href: '/settings',
            icon: Settings
        }
    ];

    const getRoleLabel = () => {
        if (role === 'super_admin') return 'Super Admin';
        if (role === 'client_admin') return 'Client Admin';
        return 'Client Viewer';
    };

    return (
        <>
            {isOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={cn(styles.sidebar, !isOpen && styles.closed)}
                aria-label="Sidebar"
                aria-expanded={isOpen}
            >
                <div className={styles.sidebarContainer}>
                    <div className={styles.logoSection}>
                        <div className={cn(styles.logoIcon, 'theme-logo-bg')}>
                            <Zap aria-hidden="true" />
                        </div>
                        <div className={styles.logoText}>
                            <h2 className="theme-text-gradient">API Monitor</h2>
                            <p>Real-Time Monitoring</p>
                        </div>
                    </div>

                    {/* User Role Badge Card */}
                    {user && (
                        <div style={{
                            margin: '0.5rem 1rem 1rem 1rem',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isSuperAdmin ? (
                                    <ShieldCheck size={16} style={{ color: '#a855f7' }} />
                                ) : isClientAdmin ? (
                                    <Building2 size={16} style={{ color: '#3b82f6' }} />
                                ) : (
                                    <Eye size={16} style={{ color: '#10b981' }} />
                                )}
                                <div style={{ fontWeight: 600, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user.username}
                                </div>
                            </div>
                            <div style={{
                                marginTop: '0.25rem',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: isSuperAdmin ? '#c084fc' : isClientAdmin ? '#60a5fa' : '#34d399'
                            }}>
                                {getRoleLabel()}
                            </div>
                        </div>
                    )}

                    <nav className={styles.navigation} aria-label="Main navigation">
                        <div className={styles.navList}>
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        end={item.href === '/'}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            cn(styles.navLink, isActive && styles.active)
                                        }
                                    >
                                        <Icon aria-hidden="true" />
                                        <div className={styles.navItem}>
                                            <div>{item.title}</div>
                                        </div>
                                    </NavLink>
                                );
                            })}
                        </div>
                    </nav>

                    <div className={styles.bottomNavigation}>
                        {bottomNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        cn(styles.navLink, isActive && styles.active)
                                    }
                                >
                                    <Icon aria-hidden="true" />
                                    <div className={styles.navItem}>
                                        <div>{item.title}</div>
                                    </div>
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </aside>
        </>
    );
}
