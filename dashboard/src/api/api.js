import axios from 'axios';
import {
    generateDemoTimeSeries,
    INITIAL_DEMO_TOP_ENDPOINTS,
    INITIAL_DEMO_USERS,
    INITIAL_DEMO_KEYS,
    INITIAL_DEMO_CLIENTS,
    getDemoStorage,
    setDemoStorage
} from '../constants/demoData';

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

export const isDemoModeActive = () => {
    try {
        return typeof window !== 'undefined' && localStorage.getItem('pulse_demo_mode') === 'true';
    } catch (_) {
        return false;
    }
};

export const getDemoUser = () => {
    const role = (typeof window !== 'undefined' && localStorage.getItem('pulse_demo_role')) || 'client_admin';
    return {
        _id: 'demo-user-1',
        username: role === 'super_admin' ? 'sarah.lin' : 'alex.rivera',
        name: role === 'super_admin' ? 'Sarah Lin' : 'Alex Rivera',
        email: role === 'super_admin' ? 'sarah.lin@pulseapi.io' : 'alex.rivera@shopsphere.io',
        role,
        isDemo: true,
        clientId: {
            _id: 'demo-client-shopsphere',
            name: 'ShopSphere Global',
            slug: 'shopsphere-global',
            isActive: true,
            description: 'Global retail & payment microservices mesh',
        },
        permissions: {
            canCreateApiKeys: true,
            canManageUsers: true,
            canViewAnalytics: true,
            canExportData: true,
        },
    };
};

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
        if (isDemoModeActive()) {
            return {
                success: true,
                data: getDemoUser(),
                message: 'Demo profile active',
            };
        }
        const response = await api.get('/auth/profile', { signal: options?.signal });
        return response.data;
    },
    logout: async () => {
        if (isDemoModeActive()) {
            try {
                localStorage.removeItem('pulse_demo_mode');
                localStorage.removeItem('pulse_demo_role');
            } catch (_) {}
            return { success: true, message: 'Logged out of demo mode' };
        }
        const response = await api.get('/auth/logout');
        return response.data;
    }
};

export const analyticsApi = {
    getDashboard: async (params = {}) => {
        if (isDemoModeActive()) {
            // Realistic interactive calculation based on selected range or filters
            const hours = params.startTime && params.endTime ? 24 : 24;
            const activity = generateDemoTimeSeries(hours, 10350);
            const totalHits = 248512;
            const errorHits = 99; // 99.96% success rate!

            return {
                success: true,
                data: {
                    stats: {
                        totalHits,
                        avgLatency: 138.4,
                        errorRate: 0.04,
                        errorHits,
                        successHits: totalHits - errorHits,
                        uniqueServices: 8,
                        uniqueEndpoints: 24,
                        p95Latency: 214.0,
                        p99Latency: 286.0,
                    },
                    topEndpoints: INITIAL_DEMO_TOP_ENDPOINTS,
                    recentActivity: activity,
                    recentActitivy: activity,
                },
                message: 'Live demo analytics telemetry',
            };
        }

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
        if (isDemoModeActive()) {
            return {
                success: true,
                data: {
                    totalHits: 248512,
                    avgLatency: 138.4,
                    errorRate: 0.04,
                    errorHits: 99,
                    successHits: 248413,
                    uniqueServices: 8,
                    uniqueEndpoints: 24,
                },
            };
        }
        const response = await api.get('/analytics/stats', { params });
        return response.data;
    }
};

export const clientApi = {
    getClients: async (params) => {
        if (isDemoModeActive()) {
            let clients = getDemoStorage('clients', INITIAL_DEMO_CLIENTS);
            if (params?.search) {
                const s = params.search.toLowerCase();
                clients = clients.filter(c => c.name.toLowerCase().includes(s) || c.slug.toLowerCase().includes(s));
            }
            if (params?.isActive !== undefined) {
                clients = clients.filter(c => c.isActive === params.isActive);
            }
            return { success: true, data: clients };
        }
        const response = await api.get('/admin/clients', { params });
        return response.data;
    },
    onboardClient: async (clientData) => {
        if (isDemoModeActive()) {
            const clients = getDemoStorage('clients', INITIAL_DEMO_CLIENTS);
            const newClient = {
                _id: `demo-client-${Date.now()}`,
                name: clientData.name,
                slug: clientData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                email: clientData.email,
                website: clientData.website || '',
                description: clientData.description || 'Enterprise API mesh',
                isActive: true,
                createdAt: new Date().toISOString(),
                totalHits: 0,
                activeKeysCount: 1,
            };
            const updated = [newClient, ...clients];
            setDemoStorage('clients', updated);
            return {
                success: true,
                data: {
                    client: newClient,
                    apiKey: { keyValue: `apim_live_${Math.random().toString(36).substring(2, 18)}` },
                },
                message: 'Client onboarded successfully (Demo Mode)',
            };
        }
        const response = await api.post('/admin/clients/onboard', clientData);
        return response.data;
    },
    updateClientStatus: async (clientId, isActive) => {
        if (isDemoModeActive()) {
            const clients = getDemoStorage('clients', INITIAL_DEMO_CLIENTS);
            const updated = clients.map(c => c._id === clientId ? { ...c, isActive } : c);
            setDemoStorage('clients', updated);
            return { success: true, data: updated.find(c => c._id === clientId), message: 'Status updated (Demo Mode)' };
        }
        const response = await api.patch(`/admin/clients/${clientId}/status`, { isActive });
        return response.data;
    },
    deleteClient: async (clientId) => {
        if (isDemoModeActive()) {
            const clients = getDemoStorage('clients', INITIAL_DEMO_CLIENTS);
            const updated = clients.filter(c => c._id !== clientId);
            setDemoStorage('clients', updated);
            return { success: true, message: 'Client deleted (Demo Mode)' };
        }
        const response = await api.delete(`/admin/clients/${clientId}`);
        return response.data;
    },
    createClientUser: async (clientId, userData) => {
        if (isDemoModeActive()) {
            const users = getDemoStorage('users', INITIAL_DEMO_USERS);
            const newUser = {
                _id: `user-demo-${Date.now()}`,
                username: userData.username,
                email: userData.email,
                role: userData.role || 'client_viewer',
                isActive: true,
                initials: (userData.username || 'U').slice(0, 2).toUpperCase(),
                title: 'Team Member',
                createdAt: new Date().toISOString(),
                lastLoginAt: 'Never',
            };
            const updated = [newUser, ...users];
            setDemoStorage('users', updated);
            return { success: true, data: newUser, message: 'Team member added (Demo Mode)' };
        }
        const response = await api.post(`/admin/clients/${clientId}/users`, userData);
        return response.data;
    },
    getClientUsers: async (clientId) => {
        if (isDemoModeActive()) {
            const users = getDemoStorage('users', INITIAL_DEMO_USERS);
            return { success: true, data: users };
        }
        const response = await api.get(`/admin/clients/${clientId}/users`);
        return response.data;
    },
    createApiKey: async (clientId, keyData) => {
        if (isDemoModeActive()) {
            const keys = getDemoStorage('keys', INITIAL_DEMO_KEYS);
            const newKey = {
                _id: `key-demo-${Date.now()}`,
                keyId: `k-${Date.now().toString(36)}`,
                name: keyData.name || 'New Ingestion Key',
                keyValue: `apim_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
                environment: keyData.environment || 'Production',
                isActive: true,
                permissions: { canIngest: true, canReadAnalytics: true },
                createdAt: new Date().toISOString(),
                lastUsedAt: 'Just now',
                totalRequests: 0,
                description: keyData.description || 'Interactive demo key',
            };
            const updated = [newKey, ...keys];
            setDemoStorage('keys', updated);
            return { success: true, data: newKey, message: 'API key created (Demo Mode)' };
        }
        const response = await api.post(`/admin/clients/${clientId}/api/keys`, keyData);
        return response.data;
    },
    getClientApiKeys: async (clientId) => {
        if (isDemoModeActive()) {
            const keys = getDemoStorage('keys', INITIAL_DEMO_KEYS);
            return { success: true, data: keys };
        }
        const response = await api.get(`/admin/clients/${clientId}/api/keys`);
        return response.data;
    },
};

export default api;
