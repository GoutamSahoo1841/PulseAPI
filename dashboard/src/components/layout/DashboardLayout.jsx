import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X, LogOut, Clock, RefreshCw, User } from 'lucide-react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import { QUERY_KEYS } from '../../constants';
import styles from '../../styles/modules/layout/DashboardLayout.module.scss';

export function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentTheme } = useTheme();
    const { user, logout, role, isSuperAdmin } = useAuth();
    const queryClient = useQueryClient();
    const isFetching = useIsFetching({ queryKey: QUERY_KEYS.DASHBOARD }) > 0;
    const { dataUpdatedAt } = useDashboardQuery({ notifyOnChangeProps: ['dataUpdatedAt'] });

    const lastUpdated = dataUpdatedAt
        ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
        : '--';

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    };

    const themeClass = currentTheme === 'purple' ? styles.themePurple : styles.themeLight;

    return (
        <div className={`${styles.container} ${themeClass}`}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <button
                            className={styles.mobileMenuButton}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                        >
                            {sidebarOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                        </button>

                        <div className={styles.pageTitle}>
                            <p>
                                <Clock aria-hidden="true" />
                                Last updated: {lastUpdated}
                            </p>
                        </div>

                        <div className={styles.actionButtons}>
                            <button
                                className={styles.refreshButton}
                                onClick={handleRefresh}
                                disabled={isFetching}
                                aria-label="Refresh data"
                            >
                                <RefreshCw
                                    className={isFetching ? styles.spinning : ''}
                                    aria-hidden="true"
                                />
                                <span className={styles.hiddenText}>Refresh</span>
                            </button>

                            {user && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '2rem',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    fontSize: '0.8125rem',
                                    marginRight: '0.5rem'
                                }}>
                                    <User size={14} style={{ color: isSuperAdmin ? '#c084fc' : '#60a5fa' }} />
                                    <span style={{ fontWeight: 600 }}>{user.username}</span>
                                    <span style={{
                                        fontSize: '0.6875rem',
                                        padding: '0.125rem 0.375rem',
                                        borderRadius: '0.25rem',
                                        background: isSuperAdmin ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                        color: isSuperAdmin ? '#d8b4fe' : '#93c5fd',
                                        fontWeight: 700
                                    }}>
                                        {role === 'super_admin' ? 'SUPER ADMIN' : role === 'client_admin' ? 'CLIENT ADMIN' : 'VIEWER'}
                                    </span>
                                </div>
                            )}

                            <button
                                className={styles.logoutButton}
                                onClick={logout}
                                aria-label="Log out"
                            >
                                <LogOut aria-hidden="true" />
                                <span className={styles.hiddenText}>Logout</span>
                            </button>
                        </div>
                    </div>
                </header>
                <main className={styles.pageContent}>
                    {children}
                </main>
            </div>
        </div>
    );
}
