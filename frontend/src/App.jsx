import React, { useEffect, useState } from 'react';
import { fetchLogs, fetchTimelineStats, fetchSourceStats, fetchAlerts, fetchTenants, setAuthToken } from './services/api';
import SummaryCard from './components/SummaryCard';
import LogTable from './components/LogTable';
import LogChart from './components/LogChart';
import Login from './components/Login';
import Alerts from './components/Alerts';
import UserManagement from './components/UserManagement';
import { Activity, Database, Server, Search, RefreshCw, LogOut, LayoutDashboard, Bell, Users, Shield, ArrowRight, Zap } from 'lucide-react';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('isLoggedIn'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
    const [userTenantAccess, setUserTenantAccess] = useState(localStorage.getItem('userTenantAccess') || '*');

    const [currentView, setCurrentView] = useState('dashboard');
    const [tenant, setTenant] = useState('');
    const [searchTenant, setSearchTenant] = useState('');
    const [logs, setLogs] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [sourceStats, setSourceStats] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [availableTenants, setAvailableTenants] = useState([]);

    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const executeFetch = async (currentTenant, isBackground = false) => {
        if (!isBackground) setIsInitialLoading(true);
        else setIsRefreshing(true);

        try {
            const [l, t, s, a] = await Promise.all([
                fetchLogs(currentTenant, { limit: 200 }),
                fetchTimelineStats(currentTenant),
                fetchSourceStats(currentTenant),
                userRole !== 'viewer' ? fetchAlerts() : Promise.resolve([])
            ]);
            setLogs(l || []);
            setTimeline(t || []);
            setSourceStats(s || []);
            setAlerts(a || []);
        } catch (e) {
            console.error(e);
        } finally {
            if (!isBackground) setIsInitialLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!isLoggedIn) return;

        const token = localStorage.getItem('authToken');
        if (token) setAuthToken(token);

        if (userRole === 'viewer' && userTenantAccess !== '*') {
            setSearchTenant(userTenantAccess);
            setTenant(userTenantAccess);
        }

        if (userRole === 'admin') {
            fetchTenants().then(setAvailableTenants);
        }

        executeFetch(searchTenant, false);
        const interval = setInterval(() => executeFetch(searchTenant, true), 15000);
        return () => clearInterval(interval);
    }, [searchTenant, isLoggedIn, userRole, userTenantAccess]);

    const handleLogin = (data) => {
        const { token, role, tenant_access, tenant_id } = data;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userTenantAccess', tenant_access);

        setAuthToken(token);
        setUserRole(role);
        setUserTenantAccess(tenant_access);
        setIsLoggedIn(true);

        if (role === 'viewer') {
            const assignedTenant = tenant_id || tenant_access;
            if (assignedTenant && assignedTenant !== '*') {
                setTenant(assignedTenant);
                setSearchTenant(assignedTenant);
            }
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        setAuthToken(null);
        setIsLoggedIn(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchTenant(tenant);
    };

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-[#0f071a] text-white flex flex-col font-sans selection:bg-brand-accent/30 selection:text-white">
            {/* Minimal Side-Nav/Header hybrid */}
            <div className="bg-[#0a0512] text-white px-5 py-3.5 flex items-center justify-between border-b border-white/5 relative z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-accent rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                            <Zap className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight uppercase">Log-<span className="text-brand-accent drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]">Processor</span></span>
                    </div>

                    <nav className="hidden md:flex items-center gap-3 ml-6 bg-white/5 p-1 rounded-full border border-white/5">
                        <button onClick={() => setCurrentView('dashboard')} className={`px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300 ${currentView === 'dashboard' ? 'bg-brand-accent text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>OVERVIEW</button>
                        {userRole === 'admin' && <button onClick={() => setCurrentView('users')} className={`px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300 ${currentView === 'users' ? 'bg-brand-accent text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>USERS</button>}
                        {userRole !== 'viewer' && (
                            <button onClick={() => setCurrentView('alerts')} className={`px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300 relative ${currentView === 'alerts' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                ALERTS {alerts.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-white text-red-600 font-black rounded-full flex items-center justify-center text-[10px] shadow-lg shadow-red-500/50">{alerts.length}</span>}
                            </button>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-5">
                    <div className="hidden sm:block text-right">
                        <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase leading-none mb-0.5">ROLE</p>
                        <p className="text-xs font-black tracking-widest text-brand-accent uppercase drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]">{userRole}</p>
                    </div>
                    <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-all group">
                        <LogOut className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>

            <main className="flex-grow flex flex-col bg-[#0f071a] relative z-10">
                {/* Background ambient glow */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

                {currentView === 'dashboard' ? (
                    <div className="p-4 md:p-8 space-y-8 max-w-[1920px] mx-auto w-full relative z-10">
                        {/* THE GRAPH (LARGEST) */}
                        <section className="bg-[#130924] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative">
                            {/* Decorative glow */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tight">Timeline Analytics</h2>
                                    <p className="text-sm text-gray-400 font-medium mt-1">Monitoring ingestion rates</p>
                                </div>
                                <div className="flex items-center gap-2 bg-[#1a0d33] border border-white/5 px-4 py-2 rounded-xl shadow-inner">
                                    <RefreshCw className={`w-4 h-4 text-brand-accent ${isRefreshing ? 'animate-spin' : ''}`} />
                                    <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest drop-shadow-[0_0_5px_rgba(124,58,237,0.3)]">Live Syncing</span>
                                </div>
                            </div>
                            <div className="h-[500px] md:h-[600px] xl:h-[70vh] min-h-[500px] w-full mt-4 relative z-10">
                                <LogChart data={timeline} color="#a78bfa" />
                            </div>
                        </section>

                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                            {/* Summary Cards & Search (Smaller) */}
                            <div className="xl:col-span-1 space-y-8">
                                <div className="grid grid-cols-1 gap-5">
                                    <SummaryCard title="Total Events" value={logs.length} icon={Database} />
                                    <SummaryCard title="Live Sources" value={sourceStats.length} icon={Server} color="text-brand-accent" />
                                </div>

                                <div className="bg-[#130924] border border-white/5 rounded-3xl p-8 shadow-2xl text-white overflow-hidden relative group hover:border-brand-purple/30 transition-all duration-500">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-5 group-hover:text-gray-400 transition-colors">Search & Filter</h3>
                                    <form onSubmit={handleSearch} className="space-y-6 relative z-10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Tenant Scope</label>
                                            {userRole === 'admin' ? (
                                                <div className="relative">
                                                    <select
                                                        className="w-full bg-[#0f071a] border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-brand-accent appearance-none text-white hover:border-white/20 transition-colors shadow-inner"
                                                        value={tenant}
                                                        onChange={(e) => setTenant(e.target.value)}
                                                    >
                                                        <option value="" className="bg-[#130924]">GLOBAL</option>
                                                        {availableTenants.map(t => (
                                                            <option key={t} value={t} className="bg-[#130924]">{t.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <div className="w-2 h-2 border-b-2 border-r-2 border-gray-400 transform rotate-45"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full bg-[#0f071a] border border-white/10 rounded-xl px-4 py-3.5 text-sm font-black text-brand-accent shadow-inner flex items-center">
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    {tenant.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" disabled={isInitialLoading} className="w-full bg-brand-accent hover:bg-[#8b5cf6] transition-all py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] active:scale-[0.98]">
                                            {isInitialLoading ? 'Syncing...' : 'Update View'}
                                        </button>
                                    </form>
                                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-brand-accent/5 blur-[50px] rounded-full group-hover:bg-brand-accent/15 transition-all duration-700 pointer-events-none"></div>
                                </div>

                                <div className="bg-[#130924] border border-white/5 rounded-3xl p-8 shadow-2xl">
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5">Top Vectors</h3>
                                    <div className="space-y-4">
                                        {sourceStats.map((s, i) => (
                                            <div key={i} className="flex justify-between items-center group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-brand-purple group-hover:bg-brand-accent group-hover:shadow-[0_0_8px_rgba(124,58,237,0.6)] transition-all"></div>
                                                    <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{s.source}</span>
                                                </div>
                                                <span className="text-[10px] font-black px-2.5 py-1 bg-[#1a0d33] text-brand-accent rounded-lg border border-white/5">{s.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Logs Table (Largest horizontal element at bottom) */}
                            <div className="xl:col-span-3">
                                <div className="bg-[#130924] border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full relative">
                                    <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-[#130924] relative z-10">
                                        <div className="flex items-center gap-3">
                                            <Activity className="w-5 h-5 text-brand-accent drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Event Stream</h3>
                                        </div>
                                        <div className="flex gap-2 bg-[#1a0d33] border border-white/5 px-3 py-1.5 rounded-full items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                                            <span className="text-[10px] font-black text-gray-300 tracking-widest uppercase">Live</span>
                                        </div>
                                    </div>
                                    <div className="flex-grow max-h-[700px] overflow-auto relative z-10 p-2">
                                        <LogTable logs={logs} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 md:p-8 max-w-screen-xl mx-auto w-full relative z-10">
                        {currentView === 'alerts' ? <Alerts alerts={alerts} /> : <UserManagement />}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;