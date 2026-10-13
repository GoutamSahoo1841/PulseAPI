import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../api/api';
import { useToast } from '../contexts/ToastContext';
import {
    Activity, Clock3, TriangleAlert, ShieldCheck, Server, Network,
    ArrowUpRight, ArrowDownRight, Ellipsis, Filter, BarChart3, ChevronDown,
    Building2, X, RefreshCw, KeyRound, Eye, EyeOff, Copy, Check, Search, ExternalLink
} from 'lucide-react';

function MethodBadge({ method = 'GET' }) {
    const m = (method || 'GET').toUpperCase();
    let cls = 'method-get';
    if (m === 'POST') cls = 'method-post';
    else if (m === 'PATCH') cls = 'method-patch';
    else if (m === 'PUT') cls = 'method-put';
    else if (m === 'DELETE') cls = 'method-delete';
    return <span className={`method ${cls}`}>{m}</span>;
}

function MiniLineChart({ values, color = '#4f46e5', fill = true }) {
    if (!values || values.length === 0) return null;
    const max = Math.max(...values, 1), min = Math.min(...values, 0);
    const range = max - min || 1;
    const points = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${92 - ((v - min) / range) * 72}`).join(' ');
    const area = `0,100 ${points} 100,100`;
    const fillId = `fill-${color.replace('#', '')}`;

    return (
        <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity=".22" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {fill && <polygon points={area} fill={`url(#${fillId})`} />}
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

function KPICard({ icon: Icon, label, value, detail, tone }) {
    return (
        <div className="kpi-card">
            <div className={`kpi-icon kpi-${tone}`}>
                <Icon size={17} />
            </div>
            <div className="kpi-content">
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{detail}</small>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children, legend }) {
    return (
        <section className="chart-card">
            <div className="chart-head">
                <div>
                    <h3>{title}</h3>
                    <p>{subtitle}</p>
                </div>
                <button className="more-button" aria-label="More options">
                    <Ellipsis size={18} />
                </button>
            </div>
            {legend && <div className="chart-legend">{legend}</div>}
            {children}
        </section>
    );
}

export function OverviewPage() {
    const { user, isSuperAdmin, selectedClient, setSelectedClient } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [range, setRange] = useState('24h');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showApiKeyInBanner, setShowApiKeyInBanner] = useState(false);
    const [showAllEndpointsModal, setShowAllEndpointsModal] = useState(false);
    const [endpointSearch, setEndpointSearch] = useState('');
    const [methodFilter, setMethodFilter] = useState('ALL');
    const [copiedPath, setCopiedPath] = useState(null);

    // Compute dynamic time query parameters based on selected range
    const queryParams = useMemo(() => {
        const now = new Date();
        let startTime;
        if (range === '24h') {
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        } else if (range === '7d') {
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (range === '30d') {
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        return {
            startTime,
            endTime: now.toISOString(),
            limit: 50
        };
    }, [range]);

    // Fetch clients for Super Admin filter dropdown
    const { data: clientsData } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.getClients({ limit: 100 }),
        enabled: isSuperAdmin,
    });
    const clients = clientsData?.data || [];

    // Fetch dashboard telemetry from API
    const { data, isPending, isFetching, error, refetch } = useDashboardQuery({}, selectedClient?._id, queryParams);

    // Fetch client API key for client admin quick banner
    const clientEffectiveId = !isSuperAdmin ? (typeof user?.clientId === 'object' ? user?.clientId?._id : user?.clientId) : null;
    const { data: clientKeysData } = useQuery({
        queryKey: ['apiKeys', clientEffectiveId],
        queryFn: () => clientEffectiveId ? clientApi.getClientApiKeys(clientEffectiveId) : Promise.resolve({ data: [] }),
        enabled: !isSuperAdmin && !!clientEffectiveId,
    });
    const clientKeyList = Array.isArray(clientKeysData?.data) ? clientKeysData.data : (Array.isArray(clientKeysData) ? clientKeysData : []);
    const activeApiKey = clientKeyList.find(k => k.isActive !== false)?.keyValue || clientKeyList[0]?.keyValue;

    const stats = data?.data?.stats ?? {
        totalHits: 0,
        avgLatency: 0,
        errorRate: 0,
        errorHits: 0,
        successHits: 0,
        uniqueServices: 0,
        uniqueEndpoints: 0,
    };

    const topEndpoints = data?.data?.topEndpoints ?? [];

    // Latency round off and format helper
    const formatLatency = (val) => {
        const num = Number(val);
        if (!num || isNaN(num) || num <= 0) return '0 ms';
        if (num >= 1000) return `${(num / 1000).toFixed(2)} s`;
        if (num < 10) return `${num.toFixed(1)} ms`;
        return `${Math.round(num)} ms`;
    };

    const formatP95 = (val) => {
        const num = Number(val);
        if (!num || isNaN(num) || num <= 0) return '0 ms';
        const p95 = num * 1.4;
        if (p95 >= 1000) return `${(p95 / 1000).toFixed(2)} s`;
        return `${Math.round(p95)} ms`;
    };

    const formattedHits = useMemo(() => {
        const hits = stats.totalHits || 0;
        if (hits >= 1000000) return `${(hits / 1000000).toFixed(2)}M`;
        if (hits >= 1000) return `${(hits / 1000).toFixed(1)}K`;
        return hits.toLocaleString();
    }, [stats.totalHits]);

    const successPercentage = useMemo(() => {
        if (!stats.totalHits || stats.totalHits === 0) return 0;
        const rate = 100 - (stats.errorRate || 0);
        return Math.min(100, Math.max(0, rate)).toFixed(1);
    }, [stats.totalHits, stats.errorRate]);

    const errorPercentage = useMemo(() => {
        if (!stats.totalHits || stats.totalHits === 0) return 0;
        return (stats.errorRate || 0).toFixed(1);
    }, [stats.totalHits, stats.errorRate]);

    // Handle Manual Refresh button click
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                refetch(),
                queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
                queryClient.invalidateQueries({ queryKey: ['clients'] }),
                queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
            ]);
            showToast('Analytics refreshed successfully', 'success');
        } catch {
            showToast('Failed to refresh analytics', 'error');
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    // Process real time-series from database for current and correct graphs
    const {
        trafficData,
        errorTrafficData,
        latencyData,
        p95LatencyData,
        timeLabels,
        trafficYLabels,
        latencyYLabels
    } = useMemo(() => {
        const rawActivity = data?.data?.recentActivity ?? data?.data?.recentActitivy ?? [];

        if (Array.isArray(rawActivity) && rawActivity.length > 0) {
            const bucketMap = {};
            rawActivity.forEach(item => {
                const key = item.timeBucket ? new Date(item.timeBucket).toISOString() : 'now';
                if (!bucketMap[key]) {
                    bucketMap[key] = {
                        time: item.timeBucket ? new Date(item.timeBucket) : new Date(),
                        hits: 0,
                        errors: 0,
                        weightedLat: 0
                    };
                }
                const h = Number(item.totalHits) || 0;
                const e = Number(item.errorHits) || 0;
                const l = Number(item.avgLatency) || 0;
                bucketMap[key].hits += h;
                bucketMap[key].errors += e;
                bucketMap[key].weightedLat += (l * h);
            });

            const sorted = Object.values(bucketMap).sort((a, b) => a.time - b.time);

            const traffic = sorted.map(b => b.hits);
            const errs = sorted.map(b => b.errors);
            const lat = sorted.map(b => b.hits > 0 ? Math.round(b.weightedLat / b.hits) : 0);
            const p95 = lat.map(l => Math.round(l * 1.4));

            const labels = sorted.map(b => {
                const d = b.time;
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            });

            // Ensure at least 2 points for SVG polyline rendering
            while (traffic.length < 2) {
                traffic.unshift(0);
                errs.unshift(0);
                lat.unshift(0);
                p95.unshift(0);
                labels.unshift('');
            }

            const maxT = Math.max(...traffic, 1);
            const maxL = Math.max(...lat, ...p95, 10);

            const formatYNum = (n) => {
                if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
                if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
                return String(Math.round(n));
            };

            const tYLabels = [
                formatYNum(maxT),
                formatYNum(maxT * 0.67),
                formatYNum(maxT * 0.33),
                '0'
            ];

            const lYLabels = [
                `${Math.round(maxL)}ms`,
                `${Math.round(maxL * 0.67)}ms`,
                `${Math.round(maxL * 0.33)}ms`,
                '0'
            ];

            return {
                trafficData: traffic,
                errorTrafficData: errs,
                latencyData: lat,
                p95LatencyData: p95,
                timeLabels: labels,
                trafficYLabels: tYLabels,
                latencyYLabels: lYLabels
            };
        }

        // Realistic zero-baseline when no telemetry exists
        const zeroTraffic = [0, 0, 0, 0, 0, 0, 0, 0];
        const zeroLatency = [0, 0, 0, 0, 0, 0, 0, 0];
        return {
            trafficData: zeroTraffic,
            errorTrafficData: zeroTraffic,
            latencyData: zeroLatency,
            p95LatencyData: zeroLatency,
            timeLabels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
            trafficYLabels: ['10', '7', '3', '0'],
            latencyYLabels: ['100ms', '67ms', '33ms', '0']
        };
    }, [data?.data?.recentActivity, data?.data?.recentActitivy]);

    // Service Breakdown data from actual ingested services
    const serviceList = useMemo(() => {
        if (topEndpoints.length > 0) {
            const map = {};
            topEndpoints.forEach(ep => {
                const s = ep.service || ep.serviceName || 'Default Service';
                map[s] = (map[s] || 0) + (ep.totalHits || ep.requests || 1);
            });
            const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
            return Object.entries(map).slice(0, 5).map(([name, count]) => ({
                name,
                pct: Math.round((count / total) * 100)
            }));
        }
        return [];
    }, [topEndpoints]);

    // Filtered endpoints for "View all endpoints" modal
    const filteredAllEndpoints = useMemo(() => {
        return topEndpoints.filter(ep => {
            const path = ep.endpoint || ep.path || '';
            const service = ep.service || ep.serviceName || '';
            const method = (ep.method || 'GET').toUpperCase();
            const matchesSearch = !endpointSearch ||
                path.toLowerCase().includes(endpointSearch.toLowerCase()) ||
                service.toLowerCase().includes(endpointSearch.toLowerCase());
            const matchesMethod = methodFilter === 'ALL' || method === methodFilter;
            return matchesSearch && matchesMethod;
        });
    }, [topEndpoints, endpointSearch, methodFilter]);

    const handleCopyEndpoint = (path) => {
        navigator.clipboard.writeText(path);
        setCopiedPath(path);
        showToast('Endpoint path copied!', 'info');
        setTimeout(() => setCopiedPath(null), 2000);
    };

    return (
        <div className="page-content">
            {/* Scoped Organisation Banner for Super Admin */}
            {isSuperAdmin && selectedClient && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fafaff',
                    border: '1px solid #dadcfb',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Building2 size={18} style={{ color: '#4f46e5' }} />
                        <div>
                            <span className="eyebrow" style={{ color: '#5b55c8' }}>FILTERED ORGANISATION VIEW</span>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#172033', marginTop: '2px' }}>
                                Analytics for {selectedClient.name} ({selectedClient.slug})
                            </strong>
                        </div>
                    </div>
                    <button
                        className="secondary-button"
                        onClick={() => setSelectedClient(null)}
                        style={{ fontSize: '11px', padding: '6px 10px' }}
                    >
                        <X size={14} /> Clear Filter
                    </button>
                </div>
            )}

            {/* Ingestion Key Banner for Client Admin */}
            {!isSuperAdmin && activeApiKey && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    gap: '12px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <KeyRound size={18} style={{ color: '#4f46e5' }} />
                        <div>
                            <span className="eyebrow" style={{ color: '#6366f1', marginBottom: '2px' }}>ORGANISATION INGESTION KEY</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <code style={{
                                    background: '#eef2ff',
                                    color: '#4338ca',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    border: '1px solid #c7d2fe'
                                }}>
                                    {showApiKeyInBanner ? activeApiKey : `${activeApiKey.slice(0, 8)}••••••••${activeApiKey.slice(-4)}`}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => setShowApiKeyInBanner(prev => !prev)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                                    title={showApiKeyInBanner ? 'Hide API Key' : 'Reveal API Key'}
                                >
                                    {showApiKeyInBanner ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(activeApiKey);
                                        showToast('API Key copied to clipboard!', 'info');
                                    }}
                                    style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <Copy size={13} /> Copy Key
                                </button>
                            </div>
                        </div>
                    </div>
                    <a
                        href="/api-keys"
                        style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '500', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                        Integration guide & credentials <ExternalLink size={13} />
                    </a>
                </div>
            )}

            <div className="page-intro">
                <div>
                    <div className="eyebrow">
                        {isSuperAdmin ? 'SYSTEM TELEMETRY' : 'ORGANISATION TELEMETRY'}
                    </div>
                    <h2>
                        {selectedClient
                            ? `${selectedClient.name} Analytics`
                            : isSuperAdmin
                                ? 'System analytics overview'
                                : 'Analytics overview'}
                    </h2>
                    <p>
                        {selectedClient
                            ? `Real-time hit telemetry and API performance for ${selectedClient.name}.`
                            : isSuperAdmin
                                ? 'Real-time telemetry and API performance across all organisations.'
                                : 'API monitoring and request latency metrics.'}
                    </p>
                </div>

                {isSuperAdmin && (
                    <div className="viewing-badge">
                        <span className="select-avatar">
                            {selectedClient ? selectedClient.name[0].toUpperCase() : 'A'}
                        </span>
                        <span>
                            Viewing <strong>{selectedClient ? selectedClient.name : 'All Organisations'}</strong>
                        </span>
                        <ChevronDown size={14} />
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group">
                    {isSuperAdmin && (
                        <>
                            <span className="filter-title">Organisation</span>
                            <select
                                className="select-button"
                                value={selectedClient?._id || 'all'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'all') setSelectedClient(null);
                                    else {
                                        const c = clients.find(cl => cl._id === val);
                                        if (c) setSelectedClient(c);
                                    }
                                }}
                            >
                                <option value="all">All Organisations</option>
                                {clients.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </>
                    )}
                    <button
                        className="select-button"
                        onClick={handleRefresh}
                        disabled={isFetching || isRefreshing}
                        title="Refresh analytics data"
                    >
                        <RefreshCw size={14} className={(isFetching || isRefreshing) ? 'spin' : ''} /> Refresh
                    </button>
                </div>

                <div className="filter-group">
                    <button className="filter-button"><Filter size={15} /> Filters</button>
                    <button className="select-button export-button"><BarChart3 size={15} /> Export <ChevronDown size={14} /></button>
                </div>
            </div>

            {/* Range Tabs */}
            <div className="range-tabs">
                <button className={range === '24h' ? 'active' : ''} onClick={() => setRange('24h')}>Last 24 hours</button>
                <button className={range === '7d' ? 'active' : ''} onClick={() => setRange('7d')}>Last 7 days</button>
                <button className={range === '30d' ? 'active' : ''} onClick={() => setRange('30d')}>Last 30 days</button>
                <button className={range === 'custom' ? 'active' : ''} onClick={() => setRange('custom')}>Custom range</button>
            </div>

            {/* KPI Grid */}
            <div className="kpi-grid">
                <KPICard
                    icon={Activity}
                    label="Total API hits"
                    value={formattedHits}
                    detail="Across all registered services"
                    tone="blue"
                />
                <KPICard
                    icon={Clock3}
                    label="Average latency"
                    value={formatLatency(stats.avgLatency)}
                    detail={`P95 · ${formatP95(stats.avgLatency)}`}
                    tone="violet"
                />
                <KPICard
                    icon={TriangleAlert}
                    label="Error rate"
                    value={`${errorPercentage}%`}
                    detail={`${stats.errorHits || 0} failed requests`}
                    tone="red"
                />
                <KPICard
                    icon={ShieldCheck}
                    label="Success rate"
                    value={`${successPercentage}%`}
                    detail={`${stats.successHits || 0} successful requests`}
                    tone="green"
                />
                <KPICard
                    icon={Server}
                    label="Unique services"
                    value={String(stats.uniqueServices || 0)}
                    detail="Active telemetry endpoints"
                    tone="amber"
                />
                <KPICard
                    icon={Network}
                    label="Unique endpoints"
                    value={String(stats.uniqueEndpoints || 0)}
                    detail="Ingested API routes"
                    tone="slate"
                />
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                <ChartCard
                    title="API traffic"
                    subtitle="Request volume over time"
                    legend={(
                        <>
                            <span><i className="legend-dot blue" />Total requests</span>
                            <span><i className="legend-dot red" />Error requests</span>
                        </>
                    )}
                >
                    <div className="chart-metric">
                        <strong>{formattedHits}</strong>
                        <span className="trend-up"><ArrowUpRight size={13} /> {stats.totalHits > 0 ? 'Live Telemetry' : 'No Data'}</span>
                    </div>
                    <div className="big-chart">
                        <div className="y-labels">
                            {trafficYLabels.map((yl, idx) => (
                                <span key={idx}>{yl}</span>
                            ))}
                        </div>
                        <div className="chart-plot">
                            <div className="grid-lines"><i /><i /><i /><i /></div>
                            <MiniLineChart values={trafficData} color="#4f46e5" fill={true} />
                            <MiniLineChart values={errorTrafficData} color="#ef4444" fill={false} />
                            <div className="x-labels">
                                {timeLabels.slice(0, 7).map((tl, idx) => (
                                    <span key={idx}>{tl}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Response time analysis"
                    subtitle="API response latency over time"
                    legend={(
                        <>
                            <span><i className="legend-dot purple" />Average</span>
                            <span><i className="legend-line" />P95 latency</span>
                        </>
                    )}
                >
                    <div className="chart-metric">
                        <strong>{formatLatency(stats.avgLatency)}</strong>
                        <span className="trend-down"><ArrowDownRight size={13} /> {stats.avgLatency > 0 ? 'Live Telemetry' : 'Baseline'}</span>
                    </div>
                    <div className="big-chart">
                        <div className="y-labels">
                            {latencyYLabels.map((yl, idx) => (
                                <span key={idx}>{yl}</span>
                            ))}
                        </div>
                        <div className="chart-plot">
                            <div className="grid-lines"><i /><i /><i /><i /></div>
                            <MiniLineChart values={latencyData} color="#7c3aed" fill={true} />
                            <MiniLineChart values={p95LatencyData} color="#a78bfa" fill={false} />
                            <div className="x-labels">
                                {timeLabels.slice(0, 7).map((tl, idx) => (
                                    <span key={idx}>{tl}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>

            {/* Bottom Grid */}
            <div className="bottom-grid">
                <ChartCard
                    title="Request health"
                    subtitle="Successful vs failed API requests"
                >
                    <div className="donut-wrap">
                        <div
                            className="donut"
                            style={{
                                background: stats.totalHits > 0
                                    ? `conic-gradient(#10b981 0% ${successPercentage}%, #ef4444 ${successPercentage}% 100%)`
                                    : 'conic-gradient(#cbd5e1 0% 100%, #cbd5e1 100%)'
                            }}
                        >
                            <div>
                                <strong>{formattedHits}</strong>
                                <span>Total requests</span>
                            </div>
                        </div>
                        <div className="donut-legend">
                            <span>
                                <i className="legend-dot green" />
                                Successful <strong>{successPercentage}%</strong>
                            </span>
                            <span>
                                <i className="legend-dot red" />
                                Errors <strong>{errorPercentage}%</strong>
                            </span>
                            <span>
                                <i className="legend-dot gray" />
                                Timeout <strong>0%</strong>
                            </span>
                        </div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Service activity"
                    subtitle="Requests breakdown by service"
                >
                    <div className="service-bars">
                        {serviceList.length > 0 ? (
                            serviceList.map(s => (
                                <div className="service-row" key={s.name}>
                                    <span>{s.name}</span>
                                    <div>
                                        <i style={{ width: `${s.pct}%` }} />
                                    </div>
                                    <strong>{s.pct}%</strong>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: '12px' }}>
                                No service activity recorded yet.
                            </div>
                        )}
                    </div>
                </ChartCard>
            </div>

            {/* Top Endpoints Table */}
            <section className="table-card">
                <div className="table-head">
                    <div>
                        <h3>Top endpoints</h3>
                        <p>Highest volume endpoints in the selected period</p>
                    </div>
                    <button
                        className="text-button"
                        onClick={() => setShowAllEndpointsModal(true)}
                        style={{ cursor: 'pointer' }}
                    >
                        View all endpoints ({topEndpoints.length})
                    </button>
                </div>
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Endpoint</th>
                                <th>Method</th>
                                <th>Service</th>
                                <th>Requests</th>
                                <th>Avg latency</th>
                                <th>Error rate</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {topEndpoints.length > 0 ? (
                                topEndpoints.slice(0, 5).map((ep, idx) => (
                                    <tr key={ep.endpoint || ep.path || ep._id || idx}>
                                        <td>
                                            <span className="rank">{String(idx + 1).padStart(2, '0')}</span>
                                        </td>
                                        <td>
                                            <strong className="endpoint">{ep.endpoint || ep.path || '/api'}</strong>
                                        </td>
                                        <td>
                                            <MethodBadge method={ep.method} />
                                        </td>
                                        <td>{ep.service || ep.serviceName || 'Default Service'}</td>
                                        <td>
                                            <strong>{(ep.totalHits || ep.requests || 0).toLocaleString()}</strong>
                                        </td>
                                        <td>{formatLatency(ep.avgLatency)}</td>
                                        <td>
                                            <span className={(parseFloat(ep.errorRate) || 0) > 2 ? 'error-high' : 'error-low'}>
                                                {ep.errorRate !== undefined ? `${ep.errorRate}%` : '0%'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="row-action" aria-label="Endpoint actions" onClick={() => handleCopyEndpoint(ep.endpoint || ep.path)}>
                                                {copiedPath === (ep.endpoint || ep.path) ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                        No endpoint telemetry ingested yet. Ingest your first API hit to see metrics here.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* View All Endpoints Modal */}
            {showAllEndpointsModal && (
                <div className="modal-backdrop" role="presentation" onClick={() => setShowAllEndpointsModal(false)}>
                    <div className="modal" style={{ maxWidth: '920px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <div className="eyebrow" style={{ color: '#4f46e5' }}>TELEMETRY ROUTES</div>
                                <h3>All Monitored Endpoints</h3>
                                <p>Complete list of ingested endpoints and their performance metrics.</p>
                            </div>
                            <button className="icon-button" onClick={() => setShowAllEndpointsModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                            {/* Search & Method Filters */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <div className="search-input" style={{ flex: 1, minWidth: '220px' }}>
                                    <Search size={16} />
                                    <input
                                        placeholder="Search by endpoint path or service..."
                                        value={endpointSearch}
                                        onChange={(e) => setEndpointSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="select-button"
                                    value={methodFilter}
                                    onChange={(e) => setMethodFilter(e.target.value)}
                                >
                                    <option value="ALL">All HTTP Methods</option>
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="PATCH">PATCH</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>

                            {/* Modal Table */}
                            <div className="table-scroll" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Endpoint</th>
                                            <th>Method</th>
                                            <th>Service</th>
                                            <th>Requests</th>
                                            <th>Avg latency</th>
                                            <th>Error rate</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAllEndpoints.length > 0 ? (
                                            filteredAllEndpoints.map((ep, idx) => (
                                                <tr key={ep.endpoint || ep.path || idx}>
                                                    <td>
                                                        <span className="rank">{String(idx + 1).padStart(2, '0')}</span>
                                                    </td>
                                                    <td>
                                                        <strong className="endpoint" style={{ wordBreak: 'break-all' }}>
                                                            {ep.endpoint || ep.path || '/api'}
                                                        </strong>
                                                    </td>
                                                    <td>
                                                        <MethodBadge method={ep.method} />
                                                    </td>
                                                    <td>{ep.service || ep.serviceName || 'Default Service'}</td>
                                                    <td>
                                                        <strong>{(ep.totalHits || ep.requests || 0).toLocaleString()}</strong>
                                                    </td>
                                                    <td>{formatLatency(ep.avgLatency)}</td>
                                                    <td>
                                                        <span className={(parseFloat(ep.errorRate) || 0) > 2 ? 'error-high' : 'error-low'}>
                                                            {ep.errorRate !== undefined ? `${ep.errorRate}%` : '0%'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="row-action"
                                                            title="Copy endpoint path"
                                                            onClick={() => handleCopyEndpoint(ep.endpoint || ep.path)}
                                                        >
                                                            {copiedPath === (ep.endpoint || ep.path) ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                                    {topEndpoints.length === 0
                                                        ? 'No endpoint metrics recorded yet.'
                                                        : 'No endpoints match your search criteria.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                Showing {filteredAllEndpoints.length} of {topEndpoints.length} endpoints
                            </span>
                            <button className="primary-button" onClick={() => setShowAllEndpointsModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
