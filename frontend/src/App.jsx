import React, { useEffect, useState } from 'react';
import { fetchLogs, fetchTimelineStats, fetchSourceStats } from './services/api';
import SummaryCard from './components/SummaryCard';
import LogTable from './components/LogTable';
import LogChart from './components/LogChart';
import Login from './components/Login';
import { Activity, Database, Server, Search, RefreshCw, Terminal, LogOut } from 'lucide-react';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [tenant, setTenant] = useState('default');
    const [searchTenant, setSearchTenant] = useState('default');
    const [logs, setLogs] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [sourceStats, setSourceStats] = useState([]);

    // Separate loading states
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Consolidated fetch function
    const executeFetch = async (currentTenant, isBackground = false) => {
        if (!isBackground) setIsInitialLoading(true);
        else setIsRefreshing(true);

        try {
            const [l, t, s] = await Promise.all([
                fetchLogs(currentTenant),
                fetchTimelineStats(currentTenant),
                fetchSourceStats(currentTenant)
            ]);
            setLogs(l || []);
            setTimeline(t || []);
            setSourceStats(s || []);
        } catch (e) {
            console.error(e);
        } finally {
            if (!isBackground) setIsInitialLoading(false);
            setIsRefreshing(false);
        }
    };

    // Effect for polling
    useEffect(() => {
        if (!isLoggedIn) return;

        executeFetch(searchTenant, false); // Initial load

        // Poll every 5 seconds
        const interval = setInterval(() => {
            executeFetch(searchTenant, true);
        }, 5000);

        return () => clearInterval(interval);
    }, [searchTenant, isLoggedIn]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (tenant.trim()) {
            setSearchTenant(tenant);
        }
    };

    if (!isLoggedIn) {
        return <Login onLogin={() => setIsLoggedIn(true)} />;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200">
            {/* Dynamic Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20"></div>

            <div className="relative max-w-7xl mx-auto p-4 md:p-8 pb-20 space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 shadow-neon">
                            <Terminal className="w-8 h-8 text-cyan-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                                LOG <span className="text-cyan-500">COMMANDER</span>
                            </h1>
                            <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                SYSTEM ONLINE
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        {isRefreshing && (
                            <span className="text-xs text-cyan-500 font-mono flex items-center gap-2 animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" /> SYNCING
                            </span>
                        )}
                        <button
                            onClick={() => setIsLoggedIn(false)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard title="Total Events" value={logs.length} icon={Database} />
                    <SummaryCard title="Active Sources" value={sourceStats.length} icon={Server} color="text-purple-400" />
                    <SummaryCard title="System Load" value={`${sourceStats.length > 0 ? 'HIGH' : 'IDLE'}`} icon={Activity} color="text-green-400" />
                </div>

                {/* Search & Controls */}
                <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg backdrop-blur-sm">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-md leading-5 bg-gray-950 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 sm:text-sm font-mono transition-all"
                                placeholder="Filter by Tenant ID..."
                                value={tenant}
                                onChange={(e) => setTenant(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isInitialLoading}
                            className="px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-900/20"
                        >
                            {isInitialLoading ? 'Searching...' : 'Execute'}
                        </button>
                    </form>
                </div>

                {/* Main Dashboard Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <LogChart data={timeline} />

                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-1">
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-gray-500" />
                                    Live Stream
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
                                            <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded group-hover:text-white transition-colors">{s.count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default App;
