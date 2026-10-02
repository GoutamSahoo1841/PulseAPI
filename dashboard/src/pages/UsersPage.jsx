import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, clientApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Users, UserPlus, Shield, Building2, Eye, Mail, Lock, User, Loader2, CheckCircle2 } from 'lucide-react';

export function UsersPage() {
    const { user: currentUser, isSuperAdmin, isClientAdmin, selectedClient } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [showModal, setShowModal] = useState(false);
    const [targetRole, setTargetRole] = useState(isSuperAdmin ? 'super_admin' : 'client_viewer');
    const [selectedClientId, setSelectedClientId] = useState(selectedClient?._id || currentUser?.clientId || '');

    // Form inputs
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Fetch clients list for Super Admin dropdown selector
    const { data: clientsData } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.getClients({ limit: 100 }),
        enabled: isSuperAdmin,
    });
    const clients = clientsData?.data || [];

    // Fetch users for target client or list
    const effectiveClientId = isSuperAdmin ? (selectedClientId || clients[0]?._id) : currentUser?.clientId;

    const { data: usersData, isLoading } = useQuery({
        queryKey: ['users', effectiveClientId],
        queryFn: () => effectiveClientId ? clientApi.getClientUsers(effectiveClientId) : Promise.resolve({ data: [] }),
        enabled: !!effectiveClientId,
    });

    const userList = usersData?.data || [];

    const createUserMutation = useMutation({
        mutationFn: async (payload) => {
            if (payload.role === 'super_admin') {
                return authApi.register(payload);
            } else {
                return clientApi.createClientUser(payload.clientId, payload);
            }
        },
        onSuccess: (res) => {
            if (res.success) {
                showToast('User created successfully!', 'success');
                setShowModal(false);
                setUsername('');
                setEmail('');
                setPassword('');
                queryClient.invalidateQueries({ queryKey: ['users'] });
            } else {
                showToast(res.message || 'Failed to create user', 'error');
            }
        },
        onError: (err) => {
            showToast(err.response?.data?.message || 'Error creating user', 'error');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (targetRole !== 'super_admin' && !selectedClientId && !currentUser?.clientId) {
            showToast('Please select an organisation for this user', 'error');
            return;
        }

        createUserMutation.mutate({
            username,
            email,
            password,
            role: targetRole,
            clientId: targetRole === 'super_admin' ? undefined : (selectedClientId || currentUser?.clientId)
        });
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'super_admin':
                return { label: 'Super Admin', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', icon: Shield };
            case 'client_admin':
                return { label: 'Client Admin', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Building2 };
            default:
                return { label: 'Client Viewer', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: Eye };
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        User Access & Permissions
                    </h1>
                    <p style={{ color: 'var(--theme-muted-text, #94a3b8)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                        Manage user accounts, roles, and administrative access for your platform
                    </p>
                </div>

                {(isSuperAdmin || isClientAdmin) && (
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1.25rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(to right, #a855f7, #6366f1)',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)'
                        }}
                    >
                        <UserPlus size={18} />
                        Add New User
                    </button>
                )}
            </div>

            {/* Filter by Organisation for Super Admin */}
            {isSuperAdmin && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'var(--theme-glass-bg, rgba(15, 23, 42, 0.6))',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.1))'
                }}>
                    <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Select Organisation Users:</label>
                    <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        style={{
                            flex: 1,
                            maxWidth: '320px',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(15,23,42,0.4)',
                            color: '#fff',
                            fontSize: '0.875rem'
                        }}
                    >
                        <option value="">-- Choose Organisation --</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>{c.name} ({c.slug})</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Users Table / List */}
            {isLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
                    Loading users...
                </div>
            ) : userList.length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    background: 'var(--theme-glass-bg, rgba(15, 23, 42, 0.4))',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.08))'
                }}>
                    <Users size={48} style={{ color: '#64748b', margin: '0 auto 1rem' }} />
                    <h3 style={{ margin: 0, fontWeight: 600 }}>No users found</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Click "Add New User" to create accounts for this organisation.
                    </p>
                </div>
            ) : (
                <div style={{
                    background: 'var(--theme-glass-bg, rgba(15, 23, 42, 0.6))',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.1))',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlignment: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: '#94a3b8' }}>User</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: '#94a3b8' }}>Role</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: '#94a3b8' }}>Permissions</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: '#94a3b8' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userList.map((u) => {
                                const badge = getRoleBadge(u.role);
                                const Icon = badge.icon;
                                return (
                                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '2.25rem',
                                                    height: '2.25rem',
                                                    borderRadius: '50%',
                                                    background: badge.bg,
                                                    color: badge.color,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    fontWeight: 700
                                                }}>
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{u.username}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.375rem',
                                                padding: '0.25rem 0.625rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: badge.bg,
                                                color: badge.color,
                                                border: `1px solid ${badge.color}40`
                                            }}>
                                                <Icon size={14} />
                                                {badge.label}
                                            </span>
                                        </td>

                                        <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#cbd5e1' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {u.permissions?.canCreateApiKeys && <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>API Keys</span>}
                                                {u.permissions?.canManageUsers && <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>User Mgmt</span>}
                                                {u.permissions?.canViewAnalytics && <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>Analytics</span>}
                                            </div>
                                        </td>

                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: u.isActive !== false ? '#10b981' : '#ef4444', fontSize: '0.8125rem' }}>
                                                <CheckCircle2 size={14} />
                                                {u.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create User Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '28rem',
                        background: 'var(--theme-glass-strong-bg, #0f172a)',
                        border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.15))',
                        borderRadius: '0.875rem',
                        padding: '1.5rem',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Add New User Account</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: '0 0 1.25rem 0' }}>
                            Grant dashboard access with specific role permissions.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Select Role</label>
                                <select
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(15,23,42,0.6)',
                                        color: '#fff',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {isSuperAdmin && <option value="super_admin">Super Admin (System Wide)</option>}
                                    <option value="client_admin">Client Admin (Org Manager)</option>
                                    <option value="client_viewer">Client Viewer (Read Only)</option>
                                </select>
                            </div>

                            {targetRole !== 'super_admin' && isSuperAdmin && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Assign Organisation *</label>
                                    <select
                                        required
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem 0.75rem',
                                            borderRadius: '0.375rem',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            background: 'rgba(15,23,42,0.6)',
                                            color: '#fff',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <option value="">-- Choose Organisation --</option>
                                        {clients.map(c => (
                                            <option key={c._id} value={c._id}>{c.name} ({c.slug})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Username *</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="johndoe"
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(15,23,42,0.6)',
                                        color: '#fff',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(15,23,42,0.6)',
                                        color: '#fff',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Password *</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password (Min 6 chars, uppercase & number)"
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(15,23,42,0.6)',
                                        color: '#fff',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.625rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'transparent',
                                        color: '#fff',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createUserMutation.isPending}
                                    style={{
                                        flex: 1,
                                        padding: '0.625rem',
                                        borderRadius: '0.375rem',
                                        border: 'none',
                                        background: 'linear-gradient(to right, #a855f7, #6366f1)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {createUserMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
