import React from 'react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

function Alerts({ alerts }) {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-[#130924] shadow-2xl rounded-3xl border border-white/5">
                <ShieldAlert className="w-12 h-12 mb-4 text-brand-purple opacity-40 group-hover:drop-shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all" />
                <p className="font-bold tracking-tight text-gray-400">No active alerts detected.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#130924] border border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 bg-[#1a0d33] font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                Active Alerts
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#130924] border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Severity</th>
                            <th className="p-4">Source</th>
                            <th className="p-4">Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {alerts.map((alert, i) => (
                            <tr key={i} className="hover:bg-[#1a0d33] transition-colors font-sans text-sm">
                                <td className="p-4 whitespace-nowrap text-gray-400 font-medium text-xs">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                                        {new Date(alert.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-black ${alert.severity >= 8 ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                                            'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                                        }`}>
                                        LEVEL {alert.severity}
                                    </span>
                                </td>
                                <td className="p-4 text-brand-accent font-bold tracking-tight text-xs">{alert.source}</td>
                                <td className="p-4 text-gray-300 font-medium">
                                    {alert.message}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Alerts;
