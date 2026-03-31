import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LogChart = ({ data }) => {
    return (
        <div className="w-full h-full relative">
            {(!data || data.length === 0) ? (
                <div className="flex items-center justify-center h-full text-gray-500 font-medium tracking-widest uppercase text-sm">No telemetry data</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#251643" vertical={false} />
                        <XAxis
                            dataKey="bucket"
                            tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            stroke="#4b5563"
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#4b5563"
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#130924', borderColor: '#4c1d95', color: '#f3f4f6', borderRadius: '0.75rem', boxShadow: '0 4px 20px -2px rgba(124, 58, 237, 0.2)', fontWeight: 600 }}
                            itemStyle={{ color: '#a78bfa', fontWeight: 700 }}
                            labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#a78bfa"
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            strokeWidth={5}
                            activeDot={{ r: 6, fill: '#a78bfa', stroke: '#130924', strokeWidth: 3 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default LogChart;
