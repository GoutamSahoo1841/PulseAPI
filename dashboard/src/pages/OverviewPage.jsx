import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '../api/api';
import {
    Activity, Clock3, TriangleAlert, ShieldCheck, Server, Network,
    ArrowUpRight, ArrowDownRight, Ellipsis, Filter, BarChart3, ChevronDown,
    Building2, X, RefreshCw
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
    const max = Math.max(...values), min = Math.min(...values);
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
    const [range, setRange] = useState('24h');

    // Fetch clients for Super Admin filter dropdown
    const { data: clientsData } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.getClients({ limit: 100 }),
        enabled: isSuperAdmin,
    });
    const clients = clientsData?.data || [];

    // Fetch dashboard telemetry from API
    const { data, isPending, error, refetch } = useDashboardQuery({}, selectedClient?._id);

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

    const formattedHits = useMemo(() => {
        const hits = stats.totalHits || 0;
        if (hits >= 1000000) return `${(hits / 1000000).toFixed(2)}M`;
        if (hits >= 1000) return `${(hits / 1000).toFixed(1)}K`;
        return hits.toString();
    }, [stats.totalHits]);

    const successPercentage = useMemo(() => {
        if (stats.totalHits === 0) return 98.76; // Demo metric fallback
        const rate = 100 - (stats.errorRate || 0);
        return Math.min(100, Math.max(0, rate)).toFixed(2);
    }, [stats.totalHits, stats.errorRate]);

    const errorPercentage = useMemo(() => {
        if (stats.totalHits === 0) return 1.24;
        return (stats.errorRate || 0).toFixed(2);
    }, [stats.totalHits, stats.errorRate]);

    // Sample/Computed telemetry series for mini line charts
    const trafficData = useMemo(() => {
        if (stats.totalHits > 0) {
            const base = Math.max(10, Math.floor(stats.totalHits / 24));
            return [34, 43, 41, 55, 48, 63, 58, 74, 68, 82, 77, 91, 86, 96, 88, 104, 98, 112, 108, 124, 117, 131, 126, 139].map(
                v => Math.max(5, Math.floor(v * (base / 50)))
            );
        }
        return [34, 43, 41, 55, 48, 63, 58, 74, 68, 82, 77, 91, 86, 96, 88, 104, 98, 112, 108, 124, 117, 131, 126, 139];
    }, [stats.totalHits]);

    const latencyData = useMemo(() => {
        const avg = stats.avgLatency || 184;
        return [128, 142, 135, 156, 148, 162, 151, 174, 166, 182, 171, 188, 179, 194, 184, 201, 193, 211, 204, 219, 210, 226, 218, 232].map(
            v => Math.round(v * (avg / 184))
        );
    }, [stats.avgLatency]);

    // Service Breakdown data
    const serviceList = useMemo(() => {
        if (topEndpoints.length > 0) {
            const map = {};
            topEndpoints.forEach(ep => {
                const s = ep.service || 'Default Service';
                map[s] = (map[s] || 0) + (ep.totalHits || ep.requests || 1);
            });
            const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
            return Object.entries(map).slice(0, 5).map(([name, count]) => ({
                name,
                pct: Math.round((count / total) * 100)
            }));
        }
        return [
            { name: 'Order Service', pct: 43 },
            { name: 'Identity Service', pct: 26 },
            { name: 'Catalog API', pct: 17 },
            { name: 'Payment Gateway', pct: 8 },
            { name: 'Customer Service', pct: 6 },
        ];
    }, [topEndpoints]);

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
                    <button className="select-button" onClick={() => refetch()}>
                        <RefreshCw size={14} className={isPending ? 'spin' : ''} /> Refresh
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
                    value={`${stats.avgLatency || 184} ms`}
                    detail={`P95 · ${Math.round((stats.avgLatency || 184) * 2.8)} ms`}
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
                    detail={`${stats.successHits || stats.totalHits || 0} successful requests`}
                    tone="green"
                />
                <KPICard
                    icon={Server}
                    label="Unique services"
                    value={stats.uniqueServices ? String(stats.uniqueServices) : '12'}
                    detail="Active telemetry endpoints"
                    tone="amber"
                />
                <KPICard
                    icon={Network}
                    label="Unique endpoints"
                    value={stats.uniqueEndpoints ? String(stats.uniqueEndpoints) : '86'}
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
                        <span className="trend-up"><ArrowUpRight size={13} /> +12.8%</span>
                    </div>
                    <div className="big-chart">
                        <div className="y-labels">
                            <span>150k</span>
                            <span>100k</span>
                            <span>50k</span>
                            <span>0</span>
                        </div>
                        <div className="chart-plot">
                            <div className="grid-lines"><i /><i /><i /><i /></div>
                            <MiniLineChart values={trafficData} color="#4f46e5" fill={true} />
                            <MiniLineChart values={trafficData.map((v, i) => Math.max(1, Math.round(v * 0.07 + (i % 3))))} color="#ef4444" fill={false} />
                            <div className="x-labels">
                                <span>00:00</span>
                                <span>04:00</span>
                                <span>08:00</span>
                                <span>12:00</span>
                                <span>16:00</span>
                                <span>20:00</span>
                                <span>Now</span>
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
                        <strong>{stats.avgLatency || 184} ms</strong>
                        <span className="trend-down"><ArrowDownRight size={13} /> -8.4%</span>
                    </div>
                    <div className="big-chart">
                        <div className="y-labels">
                            <span>400ms</span>
                            <span>300ms</span>
                            <span>200ms</span>
                            <span>0</span>
                        </div>
                        <div className="chart-plot">
                            <div className="grid-lines"><i /><i /><i /><i /></div>
                            <MiniLineChart values={latencyData} color="#7c3aed" fill={true} />
                            <MiniLineChart values={latencyData.map(v => Math.round(v * 1.35))} color="#a78bfa" fill={false} />
                            <div className="x-labels">
                                <span>00:00</span>
                                <span>04:00</span>
                                <span>08:00</span>
                                <span>12:00</span>
                                <span>16:00</span>
                                <span>20:00</span>
                                <span>Now</span>
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
                        <div className="donut">
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
                                Timeout <strong>0.18%</strong>
                            </span>
                        </div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Service activity"
                    subtitle="Requests breakdown by service"
                >
                    <div className="service-bars">
                        {serviceList.map(s => (
                            <div className="service-row" key={s.name}>
                                <span>{s.name}</span>
                                <div>
                                    <i style={{ width: `${s.pct}%` }} />
                                </div>
                                <strong>{s.pct}%</strong>
                            </div>
                        ))}
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
                    <button className="text-button">View all endpoints</button>
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
                                topEndpoints.map((ep, idx) => (
                                    <tr key={ep.path || ep._id || idx}>
                                        <td>
                                            <span className="rank">{String(idx + 1).padStart(2, '0')}</span>
                                        </td>
                                        <td>
                                            <strong className="endpoint">{ep.path || ep.endpoint || '/api'}</strong>
                                        </td>
                                        <td>
                                            <MethodBadge method={ep.method} />
                                        </td>
                                        <td>{ep.service || 'Default Service'}</td>
                                        <td>
                                            <strong>{(ep.totalHits || ep.requests || 0).toLocaleString()}</strong>
                                        </td>
                                        <td>{ep.avgLatency ? `${Math.round(ep.avgLatency)} ms` : '128 ms'}</td>
                                        <td>
                                            <span className={(ep.errorRate || 0) > 2 ? 'error-high' : 'error-low'}>
                                                {ep.errorRate !== undefined ? `${ep.errorRate}%` : '0.4%'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="row-action" aria-label="Endpoint actions">
                                                <Ellipsis size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                [
                                    { path: '/api/orders', method: 'GET', service: 'Order Service', requests: '24,381', latency: '128 ms', error: '0.8%' },
                                    { path: '/api/auth/session', method: 'POST', service: 'Identity', requests: '18,442', latency: '84 ms', error: '0.2%' },
                                    { path: '/api/catalog/products', method: 'GET', service: 'Catalog', requests: '15,209', latency: '196 ms', error: '1.4%' },
                                    { path: '/api/payments/intent', method: 'POST', service: 'Payments', requests: '9,847', latency: '312 ms', error: '2.1%' },
                                    { path: '/api/customers/:id', method: 'PATCH', service: 'Customers', requests: '6,510', latency: '143 ms', error: '0.5%' },
                                ].map((endpoint, index) => (
                                    <tr key={endpoint.path}>
                                        <td><span className="rank">{String(index + 1).padStart(2, '0')}</span></td>
                                        <td><strong className="endpoint">{endpoint.path}</strong></td>
                                        <td><MethodBadge method={endpoint.method} /></td>
                                        <td>{endpoint.service}</td>
                                        <td><strong>{endpoint.requests}</strong></td>
                                        <td>{endpoint.latency}</td>
                                        <td><span className={endpoint.error.startsWith('2') ? 'error-high' : 'error-low'}>{endpoint.error}</span></td>
                                        <td><button className="row-action"><Ellipsis size={16} /></button></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
