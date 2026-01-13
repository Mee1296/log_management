import React, { useEffect, useState } from 'react';
import { fetchLogs, fetchTimelineStats, fetchSourceStats, fetchAlerts, fetchTenants, setAuthToken } from './services/api';
import SummaryCard from './components/SummaryCard';
import LogTable from './components/LogTable';
import LogChart from './components/LogChart';
import Login from './components/Login';
import Alerts from './components/Alerts';
import { Activity, Database, Server, Search, RefreshCw, Terminal, LogOut, LayoutDashboard, Bell } from 'lucide-react';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('isLoggedIn'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
    const [userTenantAccess, setUserTenantAccess] = useState(localStorage.getItem('userTenantAccess') || '*');

    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'alerts'
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
                fetchLogs(currentTenant),
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

        // If viewer, force their tenant
        if (userRole === 'viewer' && userTenantAccess !== '*') {
            setSearchTenant(userTenantAccess);
            setTenant(userTenantAccess);
        }

        if (userRole === 'admin') {
            fetchTenants().then(setAvailableTenants);
        }

        executeFetch(searchTenant, false);
        const interval = setInterval(() => executeFetch(searchTenant, true), 5000);
        return () => clearInterval(interval);
    }, [searchTenant, isLoggedIn, userRole, userTenantAccess]);

    const handleLogin = (data) => {
        const { token, role, tenant_access, tenant_id } = data;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userTenantAccess', tenant_access);
        localStorage.setItem('userTenantId', tenant_id || tenant_access);

        setAuthToken(token);
        setUserRole(role);
        setUserTenantAccess(tenant_access);
        setIsLoggedIn(true);

        // If viewer, auto-set tenant
        if (role === 'viewer') {
            const assignedTenant = tenant_id || tenant_access;
            if (assignedTenant && assignedTenant !== '*') {
                setTenant(assignedTenant);
                setSearchTenant(assignedTenant);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userTenantAccess');
        setAuthToken(null);
        setIsLoggedIn(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (tenant.trim()) setSearchTenant(tenant);
    };

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200">
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20"></div>
            <div className="relative max-w-7xl mx-auto p-4 md:p-8 pb-20 space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 shadow-neon">
                            <Terminal className="w-8 h-8 text-cyan-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                                LOG <span className="text-cyan-500">COMMANDER</span>
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    SYSTEM ONLINE {userRole && `| ${userRole.toUpperCase()}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-800 mx-4">
                        <button
                            onClick={() => setCurrentView('dashboard')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${currentView === 'dashboard' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </button>

                        {userRole !== 'viewer' && (
                            <button
                                onClick={() => setCurrentView('alerts')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${currentView === 'alerts' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Bell className="w-4 h-4" /> Alerts
                                {alerts.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">{alerts.length}</span>}
                            </button>
                        )}
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        {isRefreshing && (
                            <span className="text-xs text-cyan-500 font-mono flex items-center gap-2 animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" /> SYNCING
                            </span>
                        )}
                        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {
                    currentView === 'dashboard' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <SummaryCard title="Total Events" value={logs.length} icon={Database} />
                                <SummaryCard title="Active Sources" value={sourceStats.length} icon={Server} color="text-purple-400" />
                                <SummaryCard title="System Load" value={`${sourceStats.length > 0 ? 'HIGH' : 'IDLE'}`} icon={Activity} color="text-green-400" />
                            </div>

                            <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg backdrop-blur-sm">
                                <form onSubmit={handleSearch} className="flex gap-4">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                                        {userRole === 'admin' ? (
                                            <select
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-md bg-gray-950 text-gray-300 focus:outline-none focus:border-cyan-500 font-mono appearance-none"
                                                value={tenant}
                                                onChange={(e) => setTenant(e.target.value)}
                                            >
                                                <option value="">All Tenants</option>
                                                {availableTenants.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-md bg-gray-950 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                                                placeholder="Filter by Tenant ID..."
                                                value={tenant}
                                                onChange={(e) => setTenant(e.target.value)}
                                                disabled={true}
                                                title="Viewers are restricted to their assigned tenant"
                                            />
                                        )}
                                    </div>
                                    <button type="submit" disabled={isInitialLoading} className="px-6 py-3 rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 shadow-lg shadow-cyan-900/20">
                                        {isInitialLoading ? 'Searching...' : 'Execute'}
                                    </button>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <LogChart data={timeline} />
                                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-1">
                                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                                            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                                <Terminal className="w-4 h-4 text-gray-500" /> Live Stream
                                            </h3>
                                            <span className="text-xs text-gray-600 font-mono">Real-time</span>
                                        </div>
                                        <LogTable logs={logs} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 h-full">
                                        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-4">Top Log Sources</h3>
                                        {sourceStats.length === 0 ? (
                                            <p className="text-sm text-gray-600 italic">No active sources</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {sourceStats.map((s, i) => (
                                                    <div key={i} className="flex justify-between items-center group cursor-default">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400"></div>
                                                            <span className="text-sm text-gray-300 font-mono">{s.source}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded group-hover:text-white">{s.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <Alerts alerts={alerts} />
                    )
                }
            </div >
        </div >
    );
}

export default App;