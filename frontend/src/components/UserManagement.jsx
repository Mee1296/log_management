import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Shield, User, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

function UserManagement() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [tenant, setTenant] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`${API_BASE_URL}/register`, 
                { username, password, tenant },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.status === 'success') {
                setSuccess(response.data.message);
                setUsername('');
                setPassword('');
                setTenant('');
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.response?.data?.detail || "Registration failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                <div className="p-2 bg-gray-900 rounded-lg border border-gray-800 shadow-neon-blue">
                    <Shield className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">User Management</h2>
                    <p className="text-sm text-gray-500">Register new viewer accounts and manage access.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration Form */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-6">
                        <UserPlus className="w-5 h-5 text-cyan-500" />
                        <h3 className="text-lg font-semibold text-gray-200">Register New User</h3>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-cyan-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-gray-950/50 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Tenant ID</label>
                                <div className="relative group">
                                    <Shield className="absolute left-3 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-cyan-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={tenant}
                                        onChange={(e) => setTenant(e.target.value)}
                                        className="w-full bg-gray-950/50 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                        placeholder="company-id or team-name"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 ml-1">Restricts viewer access to logs matching this Tenant ID.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Password</label>
                            <div className="relative group">
                                <Key className="absolute left-3 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-cyan-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-950/50 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-xs text-red-400">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span className="text-xs text-green-400">{success}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-cyan-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            {isLoading ? 'Registering...' : 'Create User'}
                        </button>
                    </form>
                </div>
                
                {/* Info Panel */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Role Information</h3>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li className="flex gap-3">
                            <Shield className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <div>
                                <strong className="text-gray-200 block">Admin (You)</strong>
                                Has access to all tenants, alerts, and user management features. Only one admin exists by default.
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <div>
                                <strong className="text-gray-200 block">Viewer</strong>
                                Read-only access to their specific Tenant dashboard. Cannot see logs from other tenants or access full system alerts. Can only see the dashboard tab.
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default UserManagement;
