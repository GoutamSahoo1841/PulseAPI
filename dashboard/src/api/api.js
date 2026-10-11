import axios from 'axios';

const rawBaseUrl = (import.meta?.env?.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRoute = error.config?.url?.includes('/auth/');
        if (error.response?.status === 401 && !isAuthRoute) {
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    onboardSuperAdmin: async (adminData) => {
        const response = await api.post('/auth/onboard-super-admin', adminData);
        return response.data;
    },
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    getProfile: async (options) => {
        const response = await api.get('/auth/profile', { signal: options?.signal });
        return response.data;
    },
    logout: async () => {
        const response = await api.get('/auth/logout');
        return response.data;
    }
};

export const analyticsApi = {
    getDashboard: async (params) => {
        const response = await api.get('/analytics/dashboard', { params });
        const payload = response.data || {};
        payload.data = payload.data || {};
        payload.data.stats = payload.data.stats ?? {
            totalHits: 0,
            avgLatency: 0,
            errorRate: 0,
            errorHits: 0,
            successHits: 0,
            uniqueServices: 0,
            uniqueEndpoints: 0,
        };
        payload.data.topEndpoints = payload.data.topEndpoints ?? [];
        payload.data.recentActivity = payload.data.recentActitivy ?? payload.data.recentActivity ?? [];
        return payload;
    },
    getStats: async (params) => {
        const response = await api.get('/analytics/stats', { params });
        return response.data;
    }
};

export const clientApi = {
    getClients: async (params) => {
        const response = await api.get('/admin/clients', { params });
        return response.data;
    },
    onboardClient: async (clientData) => {
        const response = await api.post('/admin/clients/onboard', clientData);
        return response.data;
    },
    updateClientStatus: async (clientId, isActive) => {
        const response = await api.patch(`/admin/clients/${clientId}/status`, { isActive });
        return response.data;
    },
    deleteClient: async (clientId) => {
        const response = await api.delete(`/admin/clients/${clientId}`);
        return response.data;
    },
    createClientUser: async (clientId, userData) => {
        const response = await api.post(`/admin/clients/${clientId}/users`, userData);
        return response.data;
    },
    getClientUsers: async (clientId) => {
        const response = await api.get(`/admin/clients/${clientId}/users`);
        return response.data;
    },
    createApiKey: async (clientId, keyData) => {
        const response = await api.post(`/admin/clients/${clientId}/api/keys`, keyData);
        return response.data;
    },
    getClientApiKeys: async (clientId) => {
        const response = await api.get(`/admin/clients/${clientId}/api/keys`);
        return response.data;
    },
};

export default api;
