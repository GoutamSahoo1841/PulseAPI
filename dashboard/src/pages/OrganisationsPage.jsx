import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Plus, Search, CheckCircle2, XCircle, Trash2,
    BarChart3, Globe, Mail, Loader2, Filter, X, Copy, Check, Lock
} from 'lucide-react';

export function OrganisationsPage() {
    const { setSelectedClient, isSuperAdmin } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createdResult, setCreatedResult] = useState(null); // { client, apiKey }
    const [keyCopied, setKeyCopied] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [website, setWebsite] = useState('');

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
                setShowCreateModal(false);
                setName('');
                setEmail('');
                setDescription('');
                setWebsite('');
                setCreatedResult(res.data);
                queryClient.invalidateQueries({ queryKey: ['clients'] });
                queryClient.refetchQueries({ queryKey: ['clients'] });
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
                showToast(`Organisation ${variables.isActive ? 'activated' : 'deactivated'} successfully!`, 'success');
                queryClient.invalidateQueries({ queryKey: ['clients'] });
                queryClient.refetchQueries({ queryKey: ['clients'] });
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
                queryClient.refetchQueries({ queryKey: ['clients'] });
            }
        },
        onError: (err) => {
            showToast(err.response?.data?.message || 'Failed to delete organisation', 'error');
        }
    });

    const handleCreate = (e) => {
        e.preventDefault();
        onboardMutation.mutate({ name, email, description, website });
    };

    const handleViewAnalytics = (client) => {
        setSelectedClient(client);
        navigate('/');
    };

    const handleToggleStatus = (client) => {
        statusMutation.mutate({ clientId: client._id, isActive: !client.isActive });
    };

    const handleDelete = (client) => {
        if (window.confirm(`Are you sure you want to delete "${client.name}"? This action cannot be undone.`)) {
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Organisations Directory
                    </h1>
                    <p style={{ color: 'var(--theme-muted-text, #94a3b8)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                        Manage active and inactive client organisations registered in your API Monitoring System
                    </p>
                </div>

                {isSuperAdmin && (
                    <button
                        onClick={() => setShowCreateModal(true)}
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
                        <Plus size={18} />
                        Onboard Organisation
                    </button>
                )}
            </div>

            {/* Filter and Search Bar */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                background: 'var(--theme-glass-bg, rgba(15, 23, 42, 0.6))',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.1))'
            }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search organisation name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--theme-border, rgba(255, 255, 255, 0.15))',
                            background: 'var(--theme-input-bg, rgba(15, 23, 42, 0.4))',
                            color: 'inherit',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} style={{ color: '#94a3b8' }} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '0.625rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--theme-border, rgba(255, 255, 255, 0.15))',
                            background: 'var(--theme-input-bg, rgba(15, 23, 42, 0.4))',
                            color: 'inherit',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>

            {/* List of Organisations */}
            {isLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
                    Loading organisations...
                </div>
            ) : clients.length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    background: 'var(--theme-glass-bg, rgba(15, 23, 42, 0.4))',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.08))'
                }}>
                    <Building2 size={48} style={{ color: '#64748b', margin: '0 auto 1rem' }} />
                    <h3 style={{ margin: 0, fontWeight: 600 }}>No organisations found</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        {search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Click "Onboard Organisation" to add your first client.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {clients.map((client) => (
                        <div
                            key={client._id}
                            style={{
                                background: 'var(--theme-glass-bg, rgba(15, 23, 42, 0.6))',
                                backdropFilter: 'blur(12px)',
                                borderRadius: '0.875rem',
                                border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.1))',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                        <div style={{
                                            width: '2.5rem',
                                            height: '2.5rem',
                                            borderRadius: '0.625rem',
                                            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                                            display: 'grid',
                                            placeItems: 'center',
                                            color: '#fff'
                                        }}>
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h3
                                                onClick={() => handleViewAnalytics(client)}
                                                style={{
                                                    margin: 0,
                                                    fontSize: '1.125rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    color: '#fff',
                                                    transition: 'color 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#c084fc'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
                                                title="Click to view analytics dashboard"
                                            >
                                                {client.name}
                                            </h3>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>slug: {client.slug}</span>
                                        </div>
                                    </div>

                                    {/* Active Status Badge */}
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        padding: '0.25rem 0.625rem',
                                        borderRadius: '1rem',
                                        background: client.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: client.isActive ? '#10b981' : '#ef4444',
                                        border: `1px solid ${client.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                    }}>
                                        {client.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                        {client.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {client.description && (
                                    <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                                        {client.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={14} /> {client.email}
                                    </div>
                                    {client.website && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Globe size={14} /> {client.website}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                                <button
                                    onClick={() => handleViewAnalytics(client)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(168, 85, 247, 0.4)',
                                        background: 'rgba(168, 85, 247, 0.15)',
                                        color: '#d8b4fe',
                                        fontWeight: 600,
                                        fontSize: '0.8125rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <BarChart3 size={16} /> View Analytics Dashboard
                                </button>

                                {isSuperAdmin && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleToggleStatus(client)}
                                            disabled={statusMutation.isPending}
                                            style={{
                                                flex: 1,
                                                padding: '0.4rem 0.5rem',
                                                borderRadius: '0.375rem',
                                                border: client.isActive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                                                background: client.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                color: client.isActive ? '#fca5a5' : '#6ee7b7',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                            title={client.isActive ? 'Click to deactivate organisation' : 'Click to activate organisation'}
                                        >
                                            {client.isActive ? 'Set Inactive' : 'Set Active'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client)}
                                            disabled={deleteMutation.isPending}
                                            style={{
                                                padding: '0.4rem 0.75rem',
                                                borderRadius: '0.375rem',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#fca5a5',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Organisation Modal */}
            {showCreateModal && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowCreateModal(false);
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(8px)',
                        display: 'grid',
                        placeItems: 'center',
                        padding: '1rem'
                    }}
                >
                    <div style={{
                        width: '100%',
                        maxWidth: '28rem',
                        background: 'var(--theme-glass-strong-bg, #0f172a)',
                        border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.15))',
                        borderRadius: '0.875rem',
                        padding: '1.5rem',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                        position: 'relative'
                    }}>
                        {/* Close / Exit Button */}
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#94a3b8',
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <X size={18} />
                        </button>

                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Onboard New Organisation</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: '0 0 1.25rem 0' }}>
                            Register a new client organisation in the API monitoring platform.
                        </p>

                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                                    Organisation Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Acme Corporation"
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
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                                    Contact Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@acme.com"
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
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                                    Website URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://acme.com"
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
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                                    Description (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of the client..."
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(15,23,42,0.6)',
                                        color: '#fff',
                                        fontSize: '0.875rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
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
                                    disabled={onboardMutation.isPending}
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
                                    {onboardMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Onboard'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Modal Showing Organisation & Generated API Key */}
            {createdResult && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 110,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '30rem',
                        background: 'var(--theme-glass-strong-bg, #0f172a)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '0.875rem',
                        padding: '1.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
                        position: 'relative'
                    }}>
                        <button
                            type="button"
                            onClick={() => setCreatedResult(null)}
                            style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#94a3b8',
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#10b981', marginBottom: '0.75rem' }}>
                            <CheckCircle2 size={24} />
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                                Organisation Onboarded Successfully!
                            </h2>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: '0 0 1rem 0' }}>
                            <strong style={{ color: '#a855f7' }}>{createdResult.client?.name || createdResult.name}</strong> has been registered. Below is the auto-generated initial API Key for API telemetry ingestion:
                        </p>

                        {/* Generated API Key Card */}
                        {createdResult.apiKey && (
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px dashed rgba(16, 185, 129, 0.5)',
                                borderRadius: '0.625rem',
                                padding: '1rem',
                                marginBottom: '1.25rem'
                            }}>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <Lock size={14} /> Production API Ingestion Secret
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <code style={{ flex: 1, fontFamily: 'monospace', color: '#a7f3d0', fontSize: '0.9375rem', wordBreak: 'break-all' }}>
                                        {createdResult.apiKey.keyValue}
                                    </code>
                                    <button
                                        onClick={handleCopyKey}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: '0.375rem',
                                            border: 'none',
                                            background: '#10b981',
                                            color: '#fff',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {keyCopied ? <Check size={14} /> : <Copy size={14} />}
                                        {keyCopied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setCreatedResult(null)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: 'linear-gradient(to right, #a855f7, #6366f1)',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                            }}
                        >
                            Return to Organisations Page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
