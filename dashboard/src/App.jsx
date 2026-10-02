import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import { DashboardLayout } from './components/layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const OrganisationsPage = lazy(() => import('./pages/OrganisationsPage').then(m => ({ default: m.OrganisationsPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const ApiKeysPage = lazy(() => import('./pages/ApiKeysPage').then(m => ({ default: m.ApiKeysPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const pageFallback = (
    <div style={{ height: '60vh', display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
        Loading page...
    </div>
);

function MainContent() {
    const { user, loading, isSuperAdmin, isClientAdmin } = useAuth();

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a', color: '#fff' }}>
                Loading API Monitor...
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    return (
        <DashboardLayout>
            <Suspense fallback={pageFallback}>
                <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    {isSuperAdmin && <Route path="/organisations" element={<OrganisationsPage />} />}
                    {(isSuperAdmin || isClientAdmin) && <Route path="/users" element={<UsersPage />} />}
                    {(isSuperAdmin || isClientAdmin) && <Route path="/api-keys" element={<ApiKeysPage />} />}
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </DashboardLayout>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <BrowserRouter>
                            <MainContent />
                        </BrowserRouter>
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
