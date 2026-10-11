import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, User, Building2, Server, KeyRound, Zap } from 'lucide-react';

function RoleBadge({ role }) {
    const tone = role === 'super_admin' ? 'purple' : role === 'client_admin' ? 'blue' : 'gray';
    const label = role === 'super_admin' ? 'Super Admin' : role === 'client_admin' ? 'Client Admin' : 'Client Viewer';
    return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function SettingsPage() {
    const { user, role, isSuperAdmin, selectedClient } = useAuth();

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <div className="eyebrow">SYSTEM SETTINGS</div>
                    <h2>Settings & Preferences</h2>
                    <p>Manage your user account profile, workspace preferences and telemetry configurations.</p>
                </div>
            </div>

            <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Account Profile Card */}
                <div className="chart-card">
                    <div className="chart-head" style={{ marginBottom: '16px' }}>
                        <div>
                            <h3>User Account Profile</h3>
                            <p>Current logged in user session information</p>
                        </div>
                        <User size={18} style={{ color: '#4f46e5' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label className="field-label">Username</label>
                            <div className="form-input" style={{ display: 'flex', alignItems: 'center' }}>
                                {user?.username || 'admin'}
                            </div>
                        </div>

                        <div>
                            <label className="field-label">Email Address</label>
                            <div className="form-input" style={{ display: 'flex', alignItems: 'center' }}>
                                {user?.email || `${user?.username || 'admin'}@pulseapi.io`}
                            </div>
                        </div>

                        <div>
                            <label className="field-label">Assigned Role</label>
                            <div style={{ marginTop: '4px' }}>
                                <RoleBadge role={role} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workspace Information */}
                <div className="chart-card">
                    <div className="chart-head" style={{ marginBottom: '16px' }}>
                        <div>
                            <h3>Active Workspace</h3>
                            <p>Current organization environment context</p>
                        </div>
                        <Building2 size={18} style={{ color: '#7048c8' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label className="field-label">Workspace Name</label>
                            <div className="form-input" style={{ display: 'flex', alignItems: 'center', fontWeight: '600' }}>
                                {isSuperAdmin
                                    ? (selectedClient ? selectedClient.name : 'PulseAPI System Platform (Global)')
                                    : 'Client Workspace'}
                            </div>
                        </div>

                        <div>
                            <label className="field-label">Telemetry Ingestion Endpoint</label>
                            <div className="form-input" style={{ display: 'flex', alignItems: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#4f46e5' }}>
                                http://localhost:5000/api/ingest/hits
                            </div>
                        </div>

                        <div>
                            <label className="field-label">System Security</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#139b69', fontSize: '11px', fontWeight: '600', marginTop: '6px' }}>
                                <ShieldCheck size={16} /> SOC 2 Ready Infrastructure Active
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
