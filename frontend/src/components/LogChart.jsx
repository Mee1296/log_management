import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LogChart = ({ data }) => {
    return (
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg h-80 w-full shadow-lg relative overflow-hidden">
            {/* Decorative header */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-50"></div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider">Event Velocity</h3>
                <span className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    LIVE
                </span>
            </div>

            {(!data || data.length === 0) ? (
                <div className="flex items-center justify-center h-full text-gray-600">No telemetry data</div>
            ) : (
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                            dataKey="bucket"
                            tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            stroke="#9ca3af"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                            itemStyle={{ color: '#22d3ee' }}
                            labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#22d3ee"
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default LogChart;
