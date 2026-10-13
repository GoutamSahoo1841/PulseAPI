import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, isDemoModeActive, getDemoUser } from '../api/api';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState(null); // { _id, name, slug }
    const [isDemoMode, setIsDemoMode] = useState(() => isDemoModeActive());
    const queryClient = useQueryClient();

    const fetchUser = useCallback(async (signal) => {
        try {
            if (isDemoModeActive()) {
                const demoUser = getDemoUser();
                setUser(demoUser);
                setIsDemoMode(true);
                setSelectedClient(demoUser.clientId);
                setLoading(false);
                return;
            }

            const response = await authApi.getProfile({ signal });
            if (response.success && response.data) {
                setUser(response.data);
                setIsDemoMode(false);
            } else {
                setUser(null);
                setIsDemoMode(false);
            }
        } catch (err) {
            if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                setUser(null);
                setIsDemoMode(false);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchUser(controller.signal);
        return () => controller.abort();
    }, [fetchUser]);

    useEffect(() => {
        const handle401 = () => {
            if (!isDemoModeActive()) {
                setUser(null);
                setSelectedClient(null);
                queryClient.clear();
            }
        };
        window.addEventListener('auth:unauthorized', handle401);
        return () => window.removeEventListener('auth:unauthorized', handle401);
    }, [queryClient]);

    const enterDemoMode = (role = 'client_admin') => {
        try {
            localStorage.setItem('pulse_demo_mode', 'true');
            localStorage.setItem('pulse_demo_role', role);
        } catch (_) {}
        const demoUser = getDemoUser();
        setUser(demoUser);
        setIsDemoMode(true);
        setSelectedClient(demoUser.clientId);
        queryClient.clear();
    };

    const exitDemoMode = () => {
        try {
            localStorage.removeItem('pulse_demo_mode');
            localStorage.removeItem('pulse_demo_role');
        } catch (_) {}
        setIsDemoMode(false);
        setUser(null);
        setSelectedClient(null);
        queryClient.clear();
    };

    const login = async (credentials) => {
        try {
            localStorage.removeItem('pulse_demo_mode');
            localStorage.removeItem('pulse_demo_role');
        } catch (_) {}
        setIsDemoMode(false);

        const res = await authApi.login(credentials);
        if (res.success && res.data) {
            setUser(res.data);
            queryClient.clear();
            return res;
        }
        throw new Error(res.message || 'Login failed');
    };

    const onboardSuperAdmin = async (data) => {
        try {
            localStorage.removeItem('pulse_demo_mode');
            localStorage.removeItem('pulse_demo_role');
        } catch (_) {}
        setIsDemoMode(false);

        const res = await authApi.onboardSuperAdmin(data);
        if (res.success && res.data) {
            setUser(res.data);
            queryClient.clear();
            return res;
        }
        throw new Error(res.message || 'Super admin onboarding failed');
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch { }
        try {
            localStorage.removeItem('pulse_demo_mode');
            localStorage.removeItem('pulse_demo_role');
        } catch (_) {}
        setIsDemoMode(false);
        setUser(null);
        setSelectedClient(null);
        queryClient.clear();
    };

    const isSuperAdmin = user?.role === 'super_admin';
    const isClientAdmin = user?.role === 'client_admin';
    const isClientViewer = user?.role === 'client_viewer';

    const value = {
        user,
        loading,
        role: user?.role,
        isSuperAdmin,
        isClientAdmin,
        isClientViewer,
        selectedClient,
        setSelectedClient,
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        login,
        onboardSuperAdmin,
        logout,
        refetchUser: () => fetchUser(),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
