import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, AlertTriangle, ShieldAlert } from 'lucide-react';

import { setAuthToken } from '../services/api'; 

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Block Alert State
    const [showBlockAlert, setShowBlockAlert] = useState(false);
    const [blockMessage, setBlockMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await axios.post('/api/v1/login', {
                username,
                password
            });

            if (response.data.status === 'success') {
                if (response.data.token) {
                    setAuthToken(response.data.token);
                }
                
                onLogin(response.data);
            }
        } catch (err) {
            console.error("Login error:", err);
            if (err.response && err.response.status === 403) {
                // Blocked!
                setBlockMessage(err.response.data.detail);
                setShowBlockAlert(true);
            } else {
                setError(err.response?.data?.detail || "Connection failed. Please check if backend is running.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20"></div>

            {/* Login Card */}
            <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-8 relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Access Control</h1>
                    <p className="text-gray-500 mt-2">Log Management System</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Username</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-500 transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-950/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                placeholder="Enter username"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-500 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-950/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                    >
                        {isLoading ? 'Verifying...' : 'Authenticate'}
                    </button>
                </form>
            </div>

            {/* Block Alert Modal */}
            {showBlockAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-red-900/20 transform animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                                <ShieldAlert className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Access Suspended</h2>
                            <p className="text-gray-400">{blockMessage}</p>
                            <button
                                onClick={() => setShowBlockAlert(false)}
                                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors"
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;