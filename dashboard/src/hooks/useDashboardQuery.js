import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/api';
import { QUERY_KEYS, REFETCH_INTERVAL } from '../constants';

export function useDashboardQuery(options = {}, clientId = null, params = {}) {
    return useQuery({
        queryKey: clientId ? [...QUERY_KEYS.DASHBOARD, clientId, params] : [...QUERY_KEYS.DASHBOARD, params],
        queryFn: () => analyticsApi.getDashboard({ ...(clientId ? { clientId } : {}), ...params }),
        refetchInterval: REFETCH_INTERVAL,
        ...options,
    });
}
