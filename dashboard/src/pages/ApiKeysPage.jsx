import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Key, Plus, Copy, Check, ShieldAlert, Loader2, Calendar, Lock } from 'lucide-react';

export function ApiKeysPage() {
    const { user, isSuperAdmin, isClientAdmin, selectedClient } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [selectedClientId, setSelectedClientId] = useState(selectedClient?._id || user?.clientId || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
    const [copied, setCopied] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [environment, setEnvironment] = useState('production');

    // Fetch clients list if Super Admin
    const { data: clientsData } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.getClients({ limit: 100 }),
        enabled: isSuperAdmin,
    });
    const clients = clientsData?.data || [];

    const effectiveClientId = isSuperAdmin ? (selectedClientId || clients[0]?._id) : user?.clientId;

    const { data: keysData, isLoading } = useQuery({
        queryKey: ['apiKeys', effectiveClientId],
        queryFn: () => effectiveClientId ? clientApi.getClientApiKeys(effectiveClientId) : Promise.resolve({ data: [] }),
        enabled: !!effectiveClientId,
    });

    const apiKeys = keysData?.data || [];

    const createKeyMutation = useMutation({
        mutationFn: (payload) => clientApi.createApiKey(payload.clientId, payload),
        onSuccess: (res) => {
            if (res.success && res.data) {
                showToast('API Key generated successfully!', 'success');
                setNewlyCreatedKey(res.data);
                setShowCreateModal(false);
                setName('');
                setDescription('');
                setEnvironment('production');
                queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            } else {
                showToast(res.message || 'Failed to create API key', 'error');
            }
        },
        onError: (err) => {
            showToast(err.response?.data?.message || 'Error generating API key', 'error');
        }
    });

    const handleCreate = (e) => {
        e.preventDefault();
        if (!effectiveClientId) {
            showToast('Please select an organisation first', 'error');
            return;
        }
        createKeyMutation.mutate({
            clientId: effectiveClientId,
            name,
            description,
            environment
        });
    };

    const handleCopyKey = () => {
        if (newlyCreatedKey?.keyValue) {
            navigator.clipboard.writeText(newlyCreatedKey.keyValue);
            setCopied(true);
            showToast('API Key copied to clipboard!', 'info');
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const canManageKeys = isSuperAdmin || isClientAdmin;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        API Keys & Ingestion Secrets
                    </h1>
                    <p style={{ color: 'var(--theme-muted-text, #94a3b8)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                        Generate and manage API keys used to ingest hit logs into the API Monitoring System
                    </p>
                </div>

                {canManageKeys && (
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
                        Generate API Key
                    </button>
                )}
            </div>

            {/* Super Admin Client Filter */}
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
                    <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Select Organisation:</label>
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

            {/* Newly Created Key Alert Box */}
            {newlyCreatedKey && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600 }}>
                        <Lock size={18} /> API Key Generated Successfully!
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#cbd5e1' }}>
                        Please copy your API key now. For security reasons, it will not be displayed again.
                    </p>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.5rem',
                        border: '1px dashed rgba(16, 185, 129, 0.5)'
                    }}>
                        <code style={{ flex: 1, fontFamily: 'monospace', color: '#a7f3d0', fontSize: '0.9375rem', wordBreak: 'break-all' }}>
                            {newlyCreatedKey.keyValue}
                        </code>
                        <button
                            onClick={handleCopyKey}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                background: '#10b981',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied!' : 'Copy Key'}
                        </button>
                    </div>
                </div>
            )}

            {/* Keys Table */}
            {isLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
                    Loading API keys...
                </div>
            ) : apiKeys.length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    background: 'var(--theme-glass-bg, rgba(15, 23, 42, 0.4))',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.08))'
                }}>
                    <Key size={48} style={{ color: '#64748b', margin: '0 auto 1rem' }} />
                    <h3 style={{ margin: 0, fontWeight: 600 }}>No API Keys generated</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Create an API Key to start sending hit telemetry from your application.
                    </p>
                </div>
            ) : (
                <div style={{
                    background: 'var(--theme-glass-bg, rgba(15, 23, 42, 0.6))',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--theme-glass-border, rgba(255, 255, 255, 0.1))',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: '#94a3b8' }}>Key Name</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: '#94a3b8' }}>Environment</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: '#94a3b8' }}>Key ID</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: '#94a3b8' }}>Created At</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: '#94a3b8' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apiKeys.map((key) => (
                                <tr key={key._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{key.name}</div>
                                        {key.description && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{key.description}</div>}
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.625rem',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            background: key.environment === 'production' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                            color: key.environment === 'production' ? '#d8b4fe' : '#93c5fd',
                                            border: `1px solid ${key.environment === 'production' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                                        }}>
                                            {key.environment}
                                        </span>
                                    </td>

                                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8125rem', color: '#cbd5e1' }}>
                                        {key.keyId}
                                    </td>

                                    <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#94a3b8' }}>
                                        {new Date(key.createdAt).toLocaleDateString()}
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ color: key.isActive !== false ? '#10b981' : '#ef4444', fontSize: '0.8125rem', fontWeight: 600 }}>
                                            {key.isActive !== false ? 'Active' : 'Revoked'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create API Key Modal */}
            {showCreateModal && (
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
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Generate API Ingestion Key</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: '0 0 1.25rem 0' }}>
                            Create a secure API key for integrating SDK / HTTP telemetry ingest.
                        </p>

                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Key Identifier / Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Production Backend Service"
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
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Environment</label>
                                <select
                                    value={environment}
                                    onChange={(e) => setEnvironment(e.target.value)}
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
                                    <option value="production">Production</option>
                                    <option value="staging">Staging</option>
                                    <option value="development">Development</option>
                                    <option value="testing">Testing</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Description (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Purpose of this key..."
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
                                    disabled={createKeyMutation.isPending}
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
                                    {createKeyMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Generate Key'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
