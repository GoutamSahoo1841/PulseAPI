import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
    X, MoreHorizontal, Copy, Check, BarChart3, Trash2, Power, RefreshCw
} from 'lucide-react';

function Avatar({ initials, tone = 'blue' }) {
    return <span className={`avatar avatar-${tone}`}>{initials}</span>;
}

function StatusBadge({ active }) {
    return (
        <span className={`status ${active ? 'status-active' : 'status-inactive'}`}>
            <span />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

export function OrganisationsPage() {
    const { setSelectedClient, isSuperAdmin } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [showModal, setShowModal] = useState(false);
    const [createdResult, setCreatedResult] = useState(null); // { client, apiKey }
    const [keyCopied, setKeyCopied] = useState(false);
    const [activeRowMenu, setActiveRowMenu] = useState(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');

    const { data: clientsData, isLoading, refetch } = useQuery({
        queryKey: ['clients', search, statusFilter],
        queryFn: () => clientApi.getClients({
            search,
            isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
        }),
    });

    const clients = Array.isArray(clientsData?.data) ? clientsData.data : (Array.isArray(clientsData) ? clientsData : []);

    const onboardMutation = useMutation({
        mutationFn: clientApi.onboardClient,
        onSuccess: (res) => {
            if (res.success && res.data) {
                showToast('Organisation onboarded successfully!', 'success');
                setShowModal(false);
                setName('');
                setEmail('');
                setWebsite('');
                setDescription('');
                setCreatedResult(res.data);
                queryClient.invalidateQueries({ queryKey: ['clients'] });
            } else {
                showToast(res.message || 'Failed to onboard organisation', 'error');
            }
        },
        onError: (err) => {
            showToast(err.response?.data?.message || 'Error onboarding organisation', 'error');
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ clientId, isActive }) => clientApi.updateClientStatus(clientId, isActive),
        onSuccess: (res, variables) => {
            if (res.success) {
                showToast(`Organisation ${variables.isActive ? 'activated' : 'deactivated'}!`, 'success');
                queryClient.invalidateQueries({ queryKey: ['clients'] });
            }
        },
        onError: (err) => {
            showToast(err.response?.data?.message || 'Failed to update status', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: clientApi.deleteClient,
        onSuccess: (res) => {
            if (res.success) {
                showToast('Organisation deleted successfully', 'success');
                queryClient.invalidateQueries({ queryKey: ['clients'] });
            }
        },
        onError: (err) => {
            showToast(err.response?.data?.message || 'Failed to delete organisation', 'error');
        }
    });

    const handleCreate = (e) => {
        e.preventDefault();
        onboardMutation.mutate({ name, email, website, description });
    };

    const handleViewAnalytics = (client) => {
        setSelectedClient(client);
        navigate('/');
    };

    const handleToggleStatus = (client) => {
        statusMutation.mutate({ clientId: client._id, isActive: !client.isActive });
    };

    const handleDelete = (client) => {
        if (window.confirm(`Are you sure you want to delete "${client.name}"?`)) {
            deleteMutation.mutate(client._id);
        }
    };

    const handleCopyKey = () => {
        if (createdResult?.apiKey?.keyValue) {
            navigator.clipboard.writeText(createdResult.apiKey.keyValue);
            setKeyCopied(true);
            showToast('API Key copied to clipboard!', 'info');
            setTimeout(() => setKeyCopied(false), 3000);
        }
    };

    const getInitials = (n) => {
        if (!n) return 'CO';
        const parts = n.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return n.slice(0, 2).toUpperCase();
    };

    const getAvatarTone = (idx) => {
        const tones = ['blue', 'violet', 'amber', 'purple', 'green'];
        return tones[idx % tones.length];
    };

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <div className="eyebrow">PLATFORM MANAGEMENT</div>
                    <h2>Organisations</h2>
                    <p>Manage organisations connected to the PulseAPI platform.</p>
                </div>
                {isSuperAdmin && (
                    <button className="primary-button" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> Onboard organisation
                    </button>
                )}
            </div>

            {/* Search & Filters */}
            <div className="search-filters">
                <div className="search-input">
                    <Search size={16} />
                    <input
                        placeholder="Search organisations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="select-button"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <button className="filter-button" onClick={() => refetch()}>
                    <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Organisations Table */}
            <div className="table-card management-table">
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Organisation</th>
                                <th>Status</th>
                                <th>Email</th>
                                <th>Website</th>
                                <th>Created</th>
                                <th>API Activity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length > 0 ? (
                                clients.map((org, index) => (
                                    <tr key={org._id || org.name}>
                                        <td>
                                            <div className="cell-person">
                                                <Avatar initials={getInitials(org.name)} tone={getAvatarTone(index)} />
                                                <div>
                                                    <strong style={{ cursor: 'pointer' }} onClick={() => handleViewAnalytics(org)}>
                                                        {org.name}
                                                    </strong>
                                                    <small style={{ display: 'block', color: '#8a93a4', fontSize: '9px' }}>
                                                        {org.slug || 'client'}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge active={org.isActive !== false} />
                                        </td>
                                        <td>{org.email || '—'}</td>
                                        <td className="linkish">
                                            {org.website ? (
                                                <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    {org.website}
                                                </a>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td>
                                            {org.createdAt
                                                ? new Date(org.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                                                : 'Oct 02, 2026'}
                                        </td>
                                        <td>
                                            <span className={org.isActive !== false ? 'activity-active' : 'activity-muted'}>
                                                <span />
                                                {org.isActive !== false ? 'Active telemetry' : 'No recent activity'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <button
                                                    className="icon-button"
                                                    title="View Analytics"
                                                    onClick={() => handleViewAnalytics(org)}
                                                >
                                                    <BarChart3 size={15} style={{ color: '#4f46e5' }} />
                                                </button>
                                                {isSuperAdmin && (
                                                    <>
                                                        <button
                                                            className="icon-button"
                                                            title={org.isActive !== false ? 'Deactivate' : 'Activate'}
                                                            onClick={() => handleToggleStatus(org)}
                                                        >
                                                            <Power size={15} style={{ color: org.isActive !== false ? '#e5484d' : '#139b69' }} />
                                                        </button>
                                                        <button
                                                            className="icon-button"
                                                            title="Delete"
                                                            onClick={() => handleDelete(org)}
                                                        >
                                                            <Trash2 size={15} style={{ color: '#94a3b8' }} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                        {isLoading ? 'Loading organisations...' : 'No organisations found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <span>
                        Showing <strong>{clients.length > 0 ? `1–${clients.length}` : '0'}</strong> of <strong>{clients.length}</strong>
                    </span>
                    <div>
                        <button className="page-button"><ChevronLeft size={15} /></button>
                        <button className="page-button page-current">1</button>
                        <button className="page-button"><ChevronRight size={15} /></button>
                    </div>
                </div>
            </div>

            {/* Onboard Modal */}
            {showModal && (
                <div className="modal-backdrop" role="presentation">
                    <div className="modal">
                        <div className="modal-head">
                            <div>
                                <div className="eyebrow">NEW WORKSPACE</div>
                                <h3>Onboard organisation</h3>
                                <p>Create a new organisation within PulseAPI.</p>
                            </div>
                            <button className="icon-button" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <label className="field-label">Organisation name<span>*</span></label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Acme Technologies"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />

                                <label className="field-label">Admin Email<span>*</span></label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="engineering@acme.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <label className="field-label">Website</label>
                                <input
                                    className="form-input"
                                    placeholder="https://acme.com"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />

                                <label className="field-label">Description</label>
                                <textarea
                                    className="form-input textarea"
                                    placeholder="Add a short description..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="modal-foot">
                                <button type="button" className="secondary-button" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-button" disabled={onboardMutation.isPending}>
                                    {onboardMutation.isPending ? 'Onboarding...' : 'Onboard organisation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Newly Created Credentials Modal */}
            {createdResult && (
                <div className="modal-backdrop" role="presentation">
                    <div className="modal">
                        <div className="modal-head">
                            <div>
                                <div className="eyebrow" style={{ color: '#139b69' }}>ORGANISATION CREATED</div>
                                <h3>{createdResult.client?.name} Setup Complete</h3>
                                <p>Save the generated API ingestion key safely.</p>
                            </div>
                            <button className="icon-button" onClick={() => setCreatedResult(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <label className="field-label">Default API Ingestion Key</label>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#f6f7fa',
                                border: '1px solid #dfe3ea',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '11px'
                            }}>
                                <span style={{ flex: 1, wordBreak: 'break-all' }}>
                                    {createdResult.apiKey?.keyValue || 'pk_live_secret_key'}
                                </span>
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={handleCopyKey}
                                    style={{ padding: '6px 10px', fontSize: '10px' }}
                                >
                                    {keyCopied ? <Check size={14} /> : <Copy size={14} />}
                                    {keyCopied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button className="primary-button" onClick={() => setCreatedResult(null)}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
