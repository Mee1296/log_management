import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X, FileText } from 'lucide-react';

const LogTable = ({ logs }) => {
    const [selectedLog, setSelectedLog] = useState(null);

    if (!logs || logs.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500 border border-dashed border-gray-800 rounded">
                No logs found matching criteria.
            </div>
        );
    }

    const getSeverityIcon = (severity) => {
        if (severity <= 3) return <AlertCircle className="w-4 h-4 text-red-500" />;
        if (severity === 4) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        return <Info className="w-4 h-4 text-cyan-500" />;
    };

    const getSeverityClass = (severity) => {
        if (severity <= 3) return "text-red-400";
        if (severity === 4) return "text-yellow-400";
        return "text-cyan-400";
    };

    return (
        <>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] rounded-3xl border border-white/5 bg-[#130924] shadow-2xl custom-scrollbar">
                <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-[#1a0d33] text-white uppercase tracking-widest text-[10px] font-black border-b border-white/5 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 w-10">#</th>
                            <th className="p-4 w-40">Timestamp</th>
                            <th className="p-4 w-24">Source</th>
                            <th className="p-4 w-20">Sev</th>
                            <th className="p-4">Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {logs.map((log, idx) => (
                            <tr
                                key={idx}
                                onClick={() => setSelectedLog(log)}
                                className="hover:bg-[#1a0d33] transition-colors group cursor-pointer"
                            >
                                <td className="p-4 text-gray-500 font-mono text-xs">{idx + 1}</td>
                                <td className="p-4 text-gray-400 font-medium whitespace-nowrap text-xs">
                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    })}
                                </td>
                                <td className="p-4 font-black tracking-tight text-brand-accent text-xs group-hover:drop-shadow-[0_0_8px_rgba(124,58,237,0.5)] transition-all">{log.source}</td>
                                <td className="p-4">
                                    <span className={`flex items-center gap-2 font-bold text-xs ${getSeverityClass(log.severity)}`}>
                                        {getSeverityIcon(log.severity)}
                                        {log.severity}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-300 font-medium break-all group-hover:text-white transition-colors text-sm">
                                    <div className="line-clamp-2">
                                        {log.message || (typeof log.raw_data === 'object' ? JSON.stringify(log.raw_data) : log.raw_data) || '-'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div className="bg-[#130924] border border-brand-purple/30 rounded-3xl shadow-2xl shadow-brand-purple/20 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-[#1a0d33] rounded-t-3xl">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <FileText className="w-5 h-5 text-brand-accent drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                                Log Details
                            </h3>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 overflow-y-auto space-y-4 text-sm font-sans custom-scrollbar">
                            {Object.entries(selectedLog).filter(([_, v]) => v !== null && v !== undefined && v !== "").map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 gap-4 border-b border-white/5 pb-3 last:border-0 hover:bg-[#1a0d33] p-2 rounded-xl transition-colors">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest self-center">{key.replace(/_/g, ' ')}</span>
                                    <span className="col-span-2 text-gray-300 font-medium break-words">
                                        {(key === 'raw_data' || typeof value === 'object') ? (
                                            <pre className="text-xs text-brand-accent bg-[#0f071a] p-3 rounded-xl overflow-x-auto border border-white/5 font-mono shadow-inner">
                                                {JSON.stringify(value, null, 2)}
                                            </pre>
                                        ) : (
                                            String(value)
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 bg-[#0f071a] rounded-b-3xl flex justify-end">
                            <button
                                className="px-6 py-2 bg-brand-accent hover:bg-[#8b5cf6] text-white font-black rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg shadow-brand-accent/20"
                                onClick={() => setSelectedLog(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LogTable;
