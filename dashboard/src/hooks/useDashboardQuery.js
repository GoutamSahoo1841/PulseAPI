import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/api';
import { QUERY_KEYS, REFETCH_INTERVAL } from '../constants';

export function useDashboardQuery(options = {}, clientId = null) {
    return useQuery({
        queryKey: clientId ? [...QUERY_KEYS.DASHBOARD, clientId] : QUERY_KEYS.DASHBOARD,
        queryFn: () => analyticsApi.getDashboard(clientId ? { clientId } : {}),
        refetchInterval: REFETCH_INTERVAL,
        ...options,
    });
}
