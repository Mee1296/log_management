import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Shield, User, Key, AlertTriangle, CheckCircle2, Mail } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

function UserManagement() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [tenant, setTenant] = useState('');
    const [email, setEmail] = useState('');
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
                { username, password, tenant, email },
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
                setEmail('');
            }
        } catch (err) {
            console.error("Registration error:", err);
            
            let message = "Registration failed.";
            if (err.response && err.response.data && err.response.data.detail) {
                if (typeof err.response.data.detail === 'string') {
                    message = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    // Handle FastAPI Pydantic Validation error format
                    message = err.response.data.detail.map(d => d.msg).join(', ');
                } else {
                    message = JSON.stringify(err.response.data.detail);
                }
            }
            
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-3 bg-[#1a0d33] rounded-2xl text-brand-accent shadow-sm">
                    <Shield className="w-6 h-6 drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight">User Management</h2>
                    <p className="text-sm text-gray-400 font-medium">Register new viewer accounts and manage access.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                {/* Registration Form */}
                <div className="bg-[#130924] border border-white/5 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-2 mb-8">
                        <UserPlus className="w-5 h-5 text-brand-accent" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Register New User</h3>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-[#0f071a] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-sans font-medium hover:border-white/20"
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#0f071a] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-sans font-medium hover:border-white/20"
                                        placeholder="user@example.com"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Tenant ID</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                    <input
                                        type="text"
                                        value={tenant}
                                        onChange={(e) => setTenant(e.target.value)}
                                        className="w-full bg-[#0f071a] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-sans font-medium hover:border-white/20"
                                        placeholder="company-id or team-name"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 ml-1 font-medium">Restricts viewer access to logs matching this Tenant ID.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Password</label>
                            <div className="relative group">
                                <Key className="absolute left-4 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0f071a] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-sans font-medium hover:border-white/20"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-xs text-red-400 font-bold">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <span className="text-xs text-emerald-400 font-bold">{success}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-accent hover:bg-[#8b5cf6] text-white font-black py-3.5 rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.3)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#130924] focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]"
                        >
                            {isLoading ? 'Registering...' : 'Create User'}
                        </button>
                    </form>
                </div>
                
                {/* Info Panel */}
                <div className="bg-[#130924] border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col justify-start">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Role Information</h3>
                    <ul className="space-y-6 text-sm text-gray-400">
                        <li className="flex gap-4 items-start">
                            <div className="p-3 bg-[#1a0d33] rounded-xl text-brand-accent shadow-inner">
                                <Shield className="w-5 h-5 flex-shrink-0 drop-shadow-[0_0_5px_rgba(124,58,237,0.5)]" />
                            </div>
                            <div>
                                <strong className="text-gray-200 block font-black mb-1">Admin (You)</strong>
                                <span className="font-medium leading-relaxed">Has access to all tenants, alerts, and user management features. Only one admin exists by default.</span>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <div className="p-3 bg-[#1a0d33] rounded-xl text-brand-accent shadow-inner">
                                <User className="w-5 h-5 flex-shrink-0 drop-shadow-[0_0_5px_rgba(124,58,237,0.5)]" />
                            </div>
                            <div>
                                <strong className="text-gray-200 block font-black mb-1">Viewer</strong>
                                <span className="font-medium leading-relaxed">Read-only access to their specific Tenant dashboard. Cannot see logs from other tenants or access full system alerts. Can only see the dashboard tab.</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default UserManagement;
