import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Activity, LayoutDashboard, Globe2, Users, KeyRound,
    Settings2, CircleHelp, ChevronLeft, ChevronRight,
    ChevronDown, Layers3, LogOut, MoreHorizontal
} from 'lucide-react';

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

function Avatar({ initials, tone = 'purple' }) {
    return <span className={`avatar avatar-${tone}`}>{initials}</span>;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
    const { user, isSuperAdmin, isClientAdmin, role, selectedClient, logout } = useAuth();

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

    const navItems = [
        {
            id: 'analytics',
            label: 'Analytics Overview',
            to: '/',
            icon: LayoutDashboard,
            show: true
        },
        {
            id: 'organisations',
            label: 'Organisations',
            to: '/organisations',
            icon: Globe2,
            show: isSuperAdmin
        },
        {
            id: 'users',
            label: isSuperAdmin ? 'System Users' : 'Team Members',
            to: '/users',
            icon: Users,
            show: isSuperAdmin || isClientAdmin
        },
        {
            id: 'keys',
            label: 'API Ingestion Keys',
            to: '/api-keys',
            icon: KeyRound,
            show: isSuperAdmin || isClientAdmin
        }
    ].filter(i => i.show);

    const userInitials = getInitials(user?.username || 'User');
    const workspaceName = isSuperAdmin
        ? (selectedClient ? selectedClient.name : 'PulseAPI Platform')
        : 'Client Workspace';
    const workspaceType = isSuperAdmin
        ? (selectedClient ? 'Filtered View' : 'System Workspace')
        : 'Client Workspace';

    return (
        <>
            <div
                className={`mobile-overlay ${mobileOpen ? 'open' : ''}`}
                onClick={() => setMobileOpen(false)}
            />
            <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="sidebar-head">
                    <Logo compact={collapsed} />
                    <button
                        className="collapse-button"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Toggle sidebar"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <div className="workspace-switcher" title={workspaceName}>
                    <span className="workspace-icon">
                        <Layers3 size={16} />
                    </span>
                    {!collapsed && (
                        <span>
                            <strong>{workspaceName}</strong>
                            <small>{workspaceType}</small>
                        </span>
                    )}
                    {!collapsed && <ChevronDown className="workspace-chevron" size={14} />}
                </div>

                <nav className="sidebar-nav">
                    <p className="nav-label">{!collapsed && 'WORKSPACE'}</p>
                    {navItems.map(({ id, label, to, icon: Icon }) => (
                        <NavLink
                            key={id}
                            to={to}
                            end={to === '/'}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => (isActive ? 'nav-item nav-active' : 'nav-item')}
                            title={collapsed ? label : undefined}
                        >
                            <Icon size={18} />
                            {!collapsed && <span>{label}</span>}
                            {!collapsed && id === 'analytics' && <span className="live-dot" />}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <NavLink
                        to="/settings"
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => (isActive ? 'nav-item nav-active' : 'nav-item')}
                        title={collapsed ? 'Settings' : undefined}
                    >
                        <Settings2 size={18} />
                        {!collapsed && <span>Settings</span>}
                    </NavLink>

                    <div className="sidebar-user">
                        <Avatar initials={userInitials} tone={isSuperAdmin ? 'purple' : 'blue'} />
                        {!collapsed && (
                            <span>
                                <strong>{user?.username || 'User'}</strong>
                                <small>{getRoleLabel()}</small>
                            </span>
                        )}
                        {!collapsed && <MoreHorizontal size={16} />}
                    </div>

                    <button className="logout-button nav-item" onClick={logout}>
                        <LogOut size={16} />
                        {!collapsed && 'Sign out'}
                    </button>
                </div>
            </aside>
        </>
    );
}
