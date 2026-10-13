import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, clientApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    Plus, Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
    X, MoreHorizontal, Shield, Building2, Eye, RefreshCw
} from 'lucide-react';

function Avatar({ initials, tone = 'blue' }) {
    return <span className={`avatar avatar-${tone}`}>{initials}</span>;
}

function RoleBadge({ role }) {
    const tone = role === 'super_admin' ? 'purple' : role === 'client_admin' ? 'blue' : 'gray';
    const label = role === 'super_admin' ? 'Super Admin' : role === 'client_admin' ? 'Client Admin' : 'Client Viewer';
    return <span className={`badge badge-${tone}`}>{label}</span>;
}

function StatusBadge({ active }) {
    return (
        <span className={`status ${active ? 'status-active' : 'status-inactive'}`}>
            <span />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

export function UsersPage() {
    const { user: currentUser, isSuperAdmin, isClientAdmin, selectedClient } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [targetRole, setTargetRole] = useState(isSuperAdmin ? 'super_admin' : 'client_viewer');
    const [selectedClientId, setSelectedClientId] = useState(isSuperAdmin ? 'all' : (selectedClient?._id || currentUser?.clientId || ''));
    const [modalClientId, setModalClientId] = useState('');

    // Form fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Fetch clients for Super Admin dropdown selector
    const { data: clientsData } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.getClients({ limit: 100 }),
        enabled: isSuperAdmin,
    });
    const clients = clientsData?.data || [];

    const extractId = (val) => {
        if (!val) return '';
        if (typeof val === 'object' && val._id) return String(val._id);
        return String(val);
    };

    const rawEffectiveClient = isSuperAdmin ? (selectedClientId || 'all') : (currentUser?.clientId || selectedClient?._id || '');
    const effectiveClientId = isSuperAdmin ? rawEffectiveClient : extractId(rawEffectiveClient);

    const { data: usersData, isLoading, refetch } = useQuery({
        queryKey: ['users', effectiveClientId],
        queryFn: () => effectiveClientId ? clientApi.getClientUsers(effectiveClientId) : Promise.resolve({ data: [] }),
        enabled: !!effectiveClientId,
    });

    const userList = Array.isArray(usersData?.data) ? usersData.data : (Array.isArray(usersData) ? usersData : []);

    const handleOpenModal = () => {
        setTargetRole(isSuperAdmin ? 'super_admin' : 'client_viewer');
        const initialClient = (selectedClientId && selectedClientId !== 'all' && selectedClientId !== 'super_admin')
            ? selectedClientId
            : (clients[0]?._id || '');
        setModalClientId(initialClient);
        setUsername('');
        setEmail('');
        setPassword('');
        setShowModal(true);
    };

    const createUserMutation = useMutation({
        mutationFn: async (payload) => {
            if (payload.role === 'super_admin') {
                return authApi.register(payload);
            } else {
                return clientApi.createClientUser(payload.clientId, payload);
            }
        },
        onSuccess: async (res) => {
            if (res?.success || res?.data || res?.statusCode === 201) {
                showToast('Team member added successfully!', 'success');
                setShowModal(false);
                setUsername('');
                setEmail('');
                setPassword('');
                await queryClient.invalidateQueries({ queryKey: ['users'] });
                await refetch();
            } else {
                showToast(res?.message || 'Failed to create user', 'error');
            }
        },
        onError: (err) => {
            const serverErr = err.response?.data?.error || err.response?.data?.errors;
            const msg = Array.isArray(serverErr)
                ? serverErr.join('. ')
                : (typeof serverErr === 'string' ? serverErr : (err.response?.data?.message || 'Error creating user'));
            showToast(msg, 'error');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const rawTargetClient = targetRole === 'super_admin'
            ? undefined
            : (isSuperAdmin ? modalClientId : (selectedClientId || currentUser?.clientId || selectedClient?._id));
        const payloadClientId = rawTargetClient ? extractId(rawTargetClient) : undefined;

        if (targetRole !== 'super_admin' && !payloadClientId) {
            showToast('Please select an organisation for this user', 'error');
            return;
        }

        createUserMutation.mutate({
            username,
            email,
            password,
            role: targetRole,
            clientId: payloadClientId
        });
    };

    const filteredUsers = userList.filter(u => {
        const matchesSearch = !search ||
            (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(search.toLowerCase()));
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getInitials = (n) => {
        if (!n) return 'US';
        const parts = n.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return n.slice(0, 2).toUpperCase();
    };

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <div className="eyebrow">ACCESS MANAGEMENT</div>
                    <h2>{isSuperAdmin ? 'System Users' : 'Team Members'}</h2>
                    <p>
                        {isSuperAdmin
                            ? 'Manage PulseAPI platform administrators and user access.'
                            : 'Manage users who have access to your organisation’s workspace.'}
                    </p>
                </div>
                {(isSuperAdmin || isClientAdmin) && (
                    <button className="primary-button" onClick={handleOpenModal}>
                        <Plus size={16} /> {isSuperAdmin ? 'Add user' : 'Add team member'}
                    </button>
                )}
            </div>

            {/* Search & Filters */}
            <div className="search-filters">
                <div className="search-input">
                    <Search size={16} />
                    <input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {isSuperAdmin && (
                    <select
                        className="select-button"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                        <option value="all">All Organisations</option>
                        <option value="super_admin">System Admins Only</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                )}

                <select
                    className="select-button"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="all">All roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="client_admin">Client Admin</option>
                    <option value="client_viewer">Client Viewer</option>
                </select>

                <button 
                    className="filter-button" 
                    onClick={async () => {
                        await queryClient.invalidateQueries({ queryKey: ['users'] });
                        await refetch();
                        showToast('Users list refreshed', 'info');
                    }}
                    disabled={isLoading}
                    title="Refresh team members list"
                >
                    <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Users Table */}
            <div className="table-card management-table">
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Organisation</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u._id || u.email}>
                                        <td>
                                            <div className="cell-person">
                                                <Avatar initials={getInitials(u.username)} tone={u.role === 'super_admin' ? 'purple' : 'blue'} />
                                                <strong>{u.username}</strong>
                                            </div>
                                        </td>
                                        <td>{u.email || `${u.username}@pulseapi.io`}</td>
                                        <td>
                                            <RoleBadge role={u.role} />
                                        </td>
                                        <td>{u.clientName || u.clientId?.name || (u.role === 'super_admin' ? 'Platform Admin' : 'Workspace')}</td>
                                        <td>
                                            <StatusBadge active={u.isActive !== false} />
                                        </td>
                                        <td>
                                            {u.createdAt
                                                ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                                                : 'Oct 02, 2026'}
                                        </td>
                                        <td>
                                            <button className="row-action">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                        {isLoading ? 'Loading users...' : 'No users found for this organisation.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <span>
                        Showing <strong>{filteredUsers.length > 0 ? `1–${filteredUsers.length}` : '0'}</strong> of <strong>{filteredUsers.length}</strong>
                    </span>
                    <div>
                        <button className="page-button"><ChevronLeft size={15} /></button>
                        <button className="page-button page-current">1</button>
                        <button className="page-button"><ChevronRight size={15} /></button>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            {showModal && (
                <div className="modal-backdrop" role="presentation">
                    <div className="modal">
                        <div className="modal-head">
                            <div>
                                <div className="eyebrow">ACCESS MANAGEMENT</div>
                                <h3>{isSuperAdmin ? 'Add new user' : 'Add team member'}</h3>
                                <p>Invite a user to your PulseAPI workspace.</p>
                            </div>
                            <button className="icon-button" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <label className="field-label">Username<span>*</span></label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. alex"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />

                                <label className="field-label">Email address<span>*</span></label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="alex@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <label className="field-label">Password<span>*</span></label>
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="e.g. Admin@1234"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <small style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block', marginBottom: '12px' }}>
                                    Minimum 6 characters long.
                                </small>

                                <label className="field-label">Role<span>*</span></label>
                                <select
                                    className="form-input"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                >
                                    <option value="client_viewer">Client Viewer (Read-only)</option>
                                    <option value="client_admin">Client Admin (Org Manager)</option>
                                    {isSuperAdmin && <option value="super_admin">Super Admin (System Control)</option>}
                                </select>

                                {isSuperAdmin && targetRole !== 'super_admin' && (
                                    <>
                                        <label className="field-label" style={{ marginTop: '12px' }}>Assign Organisation<span>*</span></label>
                                        <select
                                            className="form-input"
                                            value={modalClientId}
                                            onChange={(e) => setModalClientId(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Organisation</option>
                                            {clients.map(c => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>
                            <div className="modal-foot">
                                <button type="button" className="secondary-button" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-button" disabled={createUserMutation.isPending}>
                                    {createUserMutation.isPending ? 'Creating...' : 'Create user'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
