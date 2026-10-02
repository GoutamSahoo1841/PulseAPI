import { useMemo } from 'react';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { useAuth } from '../contexts/AuthContext';
import StatsGrid from '../components/StatsGrid';
import TopEndpoints from '../components/TopEndpoints';
import { ApiHitsChart, StatusDistributionChart } from '../components/charts';
import { PageStatus } from '../components/ui';
import { Building2, X, ShieldAlert } from 'lucide-react';
import styles from '../styles/modules/pages/PageComponents.module.scss';

export function OverviewPage() {
    const { selectedClient, setSelectedClient, isSuperAdmin } = useAuth();
    const { data, isPending, error, refetch } = useDashboardQuery({}, selectedClient?._id);

    const stats = data?.data?.stats ?? null;
    const topEndpoints = data?.data?.topEndpoints ?? [];

    const statusData = useMemo(() => {
        if (!stats) return null;
        return {
            labels: ['Success (2xx)', 'Errors (4xx/5xx)'],
            values: [stats.successHits, stats.errorHits],
        };
    }, [stats]);

    if (isPending || error || !data) {
        return (
            <PageStatus
                isLoading={isPending || !data}
                error={error}
                onRetry={refetch}
                loadingText="Loading dashboard..."
                errorText="Failed to load dashboard data"
            />
        );
    }

    return (
        <div className={styles.pageContainer}>
            {/* Scoped Organisation Banner for Super Admin */}
            {isSuperAdmin && selectedClient && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(to right, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.2))',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    padding: '0.875rem 1.25rem',
                    borderRadius: '0.75rem',
                    marginBottom: '1rem',
                    color: '#fff'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Building2 size={20} style={{ color: '#c084fc' }} />
                        <div>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#d8b4fe', fontWeight: 600, letterSpacing: '0.05em' }}>
                                Filtered Organisation View
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                                Analytics for: {selectedClient.name} ({selectedClient.slug})
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={() => setSelectedClient(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <X size={14} /> System-Wide Analytics
                    </button>
                </div>
            )}

            <div className={styles.pageHeader}>
                <h2>{selectedClient ? `${selectedClient.name} Dashboard` : 'System Analytics Overview'}</h2>
                <p>{selectedClient ? `Real-time hit performance for ${selectedClient.name}` : 'Real-time telemetry and API usage metrics'}</p>
            </div>

            <StatsGrid stats={stats} />

            <div className={styles.gridTwoCols}>
                <ApiHitsChart stats={stats} />
                <StatusDistributionChart data={statusData} />
            </div>

            <TopEndpoints endpoints={topEndpoints} />
        </div>
    );
}
