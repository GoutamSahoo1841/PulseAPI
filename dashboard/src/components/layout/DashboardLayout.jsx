import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Sidebar } from './Sidebar';
import {
    Menu, ChevronRight, RefreshCw, Bell, ChevronDown
} from 'lucide-react';

function Avatar({ initials, tone = 'purple' }) {
    return <span className={`avatar avatar-${tone}`}>{initials}</span>;
}

export function DashboardLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const { user, role, isSuperAdmin } = useAuth();
    const location = useLocation();
    const queryClient = useQueryClient();

    const getInitials = (name) => {
        if (!name) return 'PA';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const getRoleLabel = () => {
        if (role === 'super_admin') return 'Super Admin';
        if (role === 'client_admin') return 'Client Admin';
        return 'Client Viewer';
    };

    const getPageTitle = (pathname) => {
        switch (pathname) {
            case '/':
                return 'Analytics Overview';
            case '/organisations':
                return 'Organisations';
            case '/users':
                return isSuperAdmin ? 'System Users' : 'Team Members';
            case '/api-keys':
                return 'API Ingestion Keys';
            case '/settings':
                return 'Settings & Preferences';
            default:
                return 'Dashboard';
        }
    };

    const title = getPageTitle(location.pathname);

    const { showToast } = useToast();

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await queryClient.invalidateQueries();
            showToast('All data refreshed', 'info');
        } finally {
            setTimeout(() => setRefreshing(false), 700);
        }
    };

    return (
        <div className={`app-shell ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <div className={`main-area ${collapsed ? 'sidebar-collapsed-space' : ''}`}>
                <header className="topbar">
                    <button
                        className="mobile-menu"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>

                    <div>
                        <p className="breadcrumb">
                            PulseAPI <ChevronRight size={13} /> {title}
                        </p>
                        <h1>{title}</h1>
                    </div>

                    <div className="topbar-actions">
                        <span className="updated">
                            <span className="live-pulse" /> Live Telemetry
                        </span>
                        <button
                            className="icon-button"
                            onClick={handleRefresh}
                            aria-label="Refresh data"
                            title="Refresh data"
                        >
                            <RefreshCw size={17} className={refreshing ? 'spin' : ''} />
                        </button>
                        <button
                            className="notification-button"
                            aria-label="Notifications"
                            title="Notifications"
                        >
                            <Bell size={17} />
                            <span />
                        </button>

                        <div className="top-user">
                            <Avatar
                                initials={getInitials(user?.username || 'User')}
                                tone={isSuperAdmin ? 'purple' : 'blue'}
                            />
                            <span>
                                <strong>{user?.username || 'User'}</strong>
                                <small>{getRoleLabel()}</small>
                            </span>
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </header>

                <div className={`page-wrap ${refreshing ? 'refreshing' : ''}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}
