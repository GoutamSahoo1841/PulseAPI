import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    Plus, Search, KeyRound, ChevronDown, ChevronLeft, ChevronRight,
    X, MoreHorizontal, Copy, Check, RefreshCw, Eye, EyeOff, Code, Terminal
} from 'lucide-react';

function StatusBadge({ active }) {
    return (
        <span className={`status ${active ? 'status-active' : 'status-inactive'}`}>
            <span />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function EnvBadge({ env = 'production' }) {
    const e = env.toLowerCase();
    let cls = 'env-production';
    if (e === 'staging') cls = 'env-staging';
    else if (e === 'development' || e === 'dev') cls = 'env-development';
    return <span className={`env ${cls}`}>{env.charAt(0).toUpperCase() + env.slice(1)}</span>;
}

export function ApiKeysPage() {
    const { user, isSuperAdmin, isClientAdmin, selectedClient } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [selectedClientId, setSelectedClientId] = useState(selectedClient?._id || user?.clientId || '');
    const [search, setSearch] = useState('');
    const [envFilter, setEnvFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
    const [keyCopied, setKeyCopied] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState({});
    const [copiedKeyId, setCopiedKeyId] = useState(null);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [guideKey, setGuideKey] = useState('');

    // Form fields
    const [name, setName] = useState('');
    const [environment, setEnvironment] = useState('Production');
    const [description, setDescription] = useState('');

    // Fetch clients for Super Admin dropdown selector
    const { data: clientsData } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.getClients({ limit: 100 }),
        enabled: isSuperAdmin,
    });
    const clients = clientsData?.data || [];

    const effectiveClientId = isSuperAdmin ? (selectedClientId || clients[0]?._id) : user?.clientId;

    const { data: keysData, isLoading, refetch } = useQuery({
        queryKey: ['apiKeys', effectiveClientId],
        queryFn: () => effectiveClientId ? clientApi.getClientApiKeys(effectiveClientId) : Promise.resolve({ data: [] }),
        enabled: !!effectiveClientId,
    });

    const keyList = Array.isArray(keysData?.data) ? keysData.data : (Array.isArray(keysData) ? keysData : []);

    const createKeyMutation = useMutation({
        mutationFn: (payload) => clientApi.createApiKey(payload.clientId, payload),
        onSuccess: (res) => {
            if (res.success && res.data) {
                showToast('API Key generated successfully!', 'success');
                setNewlyCreatedKey(res.data);
                setShowModal(false);
                setName('');
                setDescription('');
                setEnvironment('Production');
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
            environment,
            description
        });
    };

    const handleCopyKey = () => {
        if (newlyCreatedKey?.keyValue) {
            navigator.clipboard.writeText(newlyCreatedKey.keyValue);
            setKeyCopied(true);
            showToast('API Key copied to clipboard!', 'info');
            setTimeout(() => setKeyCopied(false), 3000);
        }
    };

    const handleCopySpecificKey = (keyVal, id) => {
        if (!keyVal) {
            showToast('No key value available to copy', 'error');
            return;
        }
        navigator.clipboard.writeText(keyVal);
        setCopiedKeyId(id);
        showToast('API Key copied to clipboard!', 'info');
        setTimeout(() => setCopiedKeyId(null), 2500);
    };

    const toggleKeyVisibility = (keyId) => {
        setVisibleKeys(prev => ({
            ...prev,
            [keyId]: !prev[keyId]
        }));
    };

    const openGuide = (keyVal) => {
        setGuideKey(keyVal || filteredKeys[0]?.keyValue || 'pk_live_your_api_key_here');
        setShowGuideModal(true);
    };

    const maskKey = (keyVal) => {
        if (!keyVal) return 'pk_live_••••••••8F2A';
        if (keyVal.length <= 10) return keyVal;
        return `${keyVal.slice(0, 8)}••••••••${keyVal.slice(-4)}`;
    };

    const filteredKeys = keyList.filter(k => {
        const matchesSearch = !search || (k.name && k.name.toLowerCase().includes(search.toLowerCase()));
        const matchesEnv = envFilter === 'all' || (k.environment && k.environment.toLowerCase() === envFilter.toLowerCase());
        return matchesSearch && matchesEnv;
    });

    const canManageKeys = isSuperAdmin || isClientAdmin;

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <div className="eyebrow">CREDENTIALS</div>
                    <h2>API Ingestion Keys</h2>
                    <p>
                        {isSuperAdmin
                            ? 'Manage telemetry ingestion credentials across organisations.'
                            : 'Manage ingestion credentials for your organisation.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="secondary-button" onClick={() => openGuide(filteredKeys[0]?.keyValue)}>
                        <Code size={16} /> How to implement in website
                    </button>
                    {canManageKeys && (
                        <button className="primary-button" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> Create ingestion key
                        </button>
                    )}
                </div>
            </div>

            {/* Search & Filters */}
            <div className="search-filters">
                <div className="search-input">
                    <Search size={16} />
                    <input
                        placeholder="Search keys..."
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
                        <option value="">Select Organisation</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                )}

                <select
                    className="select-button"
                    value={envFilter}
                    onChange={(e) => setEnvFilter(e.target.value)}
                >
                    <option value="all">All environments</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                </select>

                <button className="filter-button" onClick={() => refetch()}>
                    <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Keys Table */}
            <div className="table-card management-table">
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Key Name</th>
                                <th>Organisation</th>
                                <th>Environment</th>
                                <th>Created</th>
                                <th>Expires</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {filteredKeys.length > 0 ? (
                                filteredKeys.map((k) => (
                                    <tr key={k._id || k.keyValue}>
                                        <td>
                                            <div className="key-cell">
                                                <KeyRound size={16} style={{ color: '#4f46e5', marginTop: '3px' }} />
                                                <div>
                                                    <strong style={{ display: 'block', fontSize: '13px' }}>{k.name || 'API Key'}</strong>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                        <code style={{
                                                            background: visibleKeys[k._id] ? '#eef2ff' : '#f1f5f9',
                                                            color: visibleKeys[k._id] ? '#4338ca' : '#475569',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontFamily: 'monospace',
                                                            fontSize: '11px',
                                                            fontWeight: '500',
                                                            border: '1px solid ' + (visibleKeys[k._id] ? '#c7d2fe' : '#e2e8f0'),
                                                            letterSpacing: visibleKeys[k._id] ? '0px' : '0.5px'
                                                        }}>
                                                            {visibleKeys[k._id] ? (k.keyValue || 'pk_live_••••••••8F2A') : maskKey(k.keyValue)}
                                                        </code>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleKeyVisibility(k._id)}
                                                            title={visibleKeys[k._id] ? 'Hide API key' : 'Show API key'}
                                                            style={{
                                                                background: '#f8fafc',
                                                                border: '1px solid #cbd5e1',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                padding: '3px 6px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                color: '#475569'
                                                            }}
                                                        >
                                                            {visibleKeys[k._id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopySpecificKey(k.keyValue, k._id)}
                                                            title="Copy API key"
                                                            style={{
                                                                background: copiedKeyId === k._id ? '#ecfdf5' : '#f8fafc',
                                                                border: '1px solid ' + (copiedKeyId === k._id ? '#10b981' : '#cbd5e1'),
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                padding: '3px 6px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '11px',
                                                                color: copiedKeyId === k._id ? '#059669' : '#475569'
                                                            }}
                                                        >
                                                            {copiedKeyId === k._id ? <Check size={13} /> : <Copy size={13} />}
                                                            <span>{copiedKeyId === k._id ? 'Copied' : 'Copy'}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openGuide(k.keyValue)}
                                                            title="View integration guide for this key"
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#4f46e5',
                                                                fontSize: '11px',
                                                                cursor: 'pointer',
                                                                textDecoration: 'underline',
                                                                padding: '2px 4px'
                                                            }}
                                                        >
                                                            Implement
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{k.clientName || k.clientId?.name || 'Organisation'}</td>
                                        <td>
                                            <EnvBadge env={k.environment || 'Production'} />
                                        </td>
                                        <td>
                                            {k.createdAt
                                                ? new Date(k.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                                                : 'Oct 02, 2026'}
                                        </td>
                                        <td>{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Never'}</td>
                                        <td>
                                            <StatusBadge active={k.isActive !== false} />
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
                                        {isLoading ? 'Loading ingestion keys...' : 'No API keys found for this organisation.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <span>
                        Showing <strong>{filteredKeys.length > 0 ? `1–${filteredKeys.length}` : '0'}</strong> of <strong>{filteredKeys.length}</strong>
                    </span>
                    <div>
                        <button className="page-button"><ChevronLeft size={15} /></button>
                        <button className="page-button page-current">1</button>
                        <button className="page-button"><ChevronRight size={15} /></button>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-backdrop" role="presentation">
                    <div className="modal">
                        <div className="modal-head">
                            <div>
                                <div className="eyebrow">SECURE CREDENTIAL</div>
                                <h3>Create API ingestion key</h3>
                                <p>Generate a credential for sending telemetry.</p>
                            </div>
                            <button className="icon-button" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <label className="field-label">Key identifier / name<span>*</span></label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Production Backend"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />

                                <label className="field-label">Environment<span>*</span></label>
                                <select
                                    className="form-input"
                                    value={environment}
                                    onChange={(e) => setEnvironment(e.target.value)}
                                >
                                    <option value="Production">Production</option>
                                    <option value="Staging">Staging</option>
                                    <option value="Development">Development</option>
                                </select>

                                {isSuperAdmin && (
                                    <>
                                        <label className="field-label">Target Organisation<span>*</span></label>
                                        <select
                                            className="form-input"
                                            value={selectedClientId}
                                            onChange={(e) => setSelectedClientId(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Organisation</option>
                                            {clients.map(c => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </>
                                )}

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
                                <button type="submit" className="primary-button" disabled={createKeyMutation.isPending}>
                                    {createKeyMutation.isPending ? 'Generating...' : 'Generate key'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generated Secret Modal */}
            {newlyCreatedKey && (
                <div className="modal-backdrop" role="presentation">
                    <div className="modal">
                        <div className="modal-head">
                            <div>
                                <div className="eyebrow" style={{ color: '#139b69' }}>SECRET GENERATED</div>
                                <h3>API Ingestion Key Created</h3>
                                <p>Please copy and save this key securely. It won't be shown again in full.</p>
                            </div>
                            <button className="icon-button" onClick={() => setNewlyCreatedKey(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <label className="field-label">API Key Value</label>
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
                                    {newlyCreatedKey.keyValue || 'pk_live_secret_key'}
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
                            <button className="primary-button" onClick={() => setNewlyCreatedKey(null)}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Website Implementation Guide Modal */}
            {showGuideModal && (
                <div className="modal-backdrop" role="presentation" onClick={() => setShowGuideModal(false)}>
                    <div className="modal" style={{ maxWidth: '680px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <div className="eyebrow" style={{ color: '#4f46e5' }}>INTEGRATION GUIDE</div>
                                <h3>Implement in Your Organisation Website</h3>
                                <p>Send API traffic telemetry to PulseAPI using your active Ingestion Key.</p>
                            </div>
                            <button className="icon-button" onClick={() => setShowGuideModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="field-label">Your Ingestion API Key</label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px'
                                }}>
                                    <span style={{ flex: 1, wordBreak: 'break-all', color: '#1e293b', fontWeight: '600' }}>
                                        {guideKey || 'pk_live_your_api_key_here'}
                                    </span>
                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(guideKey || '');
                                            showToast('API Key copied to clipboard!', 'info');
                                        }}
                                        style={{ padding: '6px 10px', fontSize: '11px' }}
                                    >
                                        <Copy size={13} /> Copy Key
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <h4 style={{ fontSize: '13px', marginBottom: '6px', color: '#1e293b' }}>
                                    1. Ingestion Endpoint URL
                                </h4>
                                <div style={{
                                    background: '#0f172a',
                                    color: '#38bdf8',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>POST http://localhost:5000/api/hit</span>
                                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>Header: x-api-key</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <h4 style={{ fontSize: '13px', marginBottom: '6px', color: '#1e293b' }}>
                                    2. Express.js Middleware Integration (Node.js)
                                </h4>
                                <pre style={{
                                    background: '#0f172a',
                                    color: '#e2e8f0',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    overflowX: 'auto',
                                    lineHeight: '1.5'
                                }}>
{`// middleware/monitoring.js
const axios = require('axios');

module.exports = function monitoringMiddleware(req, res, next) {
    const startTime = Date.now();
    const originalEnd = res.end;

    res.end = function (...args) {
        const responseTime = Date.now() - startTime;
        
        // Asynchronously report telemetry to PulseAPI
        axios.post('http://localhost:5000/api/hit', {
            serviceName: 'client-website',
            endpoint: req.originalUrl || req.url,
            method: req.method,
            statusCode: res.statusCode,
            latencyMs: responseTime
        }, {
            headers: { 'x-api-key': '${guideKey || 'YOUR_API_KEY'}' }
        }).catch(() => {}); // non-blocking

        originalEnd.apply(res, args);
    };
    next();
};

// In your server.js or app.js:
// app.use(monitoringMiddleware);`}
                                </pre>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '13px', marginBottom: '6px', color: '#1e293b' }}>
                                    3. Quick cURL Test
                                </h4>
                                <pre style={{
                                    background: '#0f172a',
                                    color: '#a7f3d0',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    overflowX: 'auto',
                                    lineHeight: '1.4'
                                }}>
{`curl -X POST http://localhost:5000/api/hit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${guideKey || 'YOUR_API_KEY'}" \\
  -d '{
    "serviceName": "website-service",
    "endpoint": "/api/checkout",
    "method": "POST",
    "statusCode": 200,
    "latencyMs": 85
  }'`}
                                </pre>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button className="primary-button" onClick={() => setShowGuideModal(false)}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
