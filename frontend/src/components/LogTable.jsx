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
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] rounded-lg border border-gray-800 bg-gray-900 shadow-xl custom-scrollbar">
                <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-gray-800 text-gray-400 uppercase tracking-wider text-xs border-b border-gray-700 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 w-10">#</th>
                            <th className="p-3 w-40">Timestamp</th>
                            <th className="p-3 w-24">Source</th>
                            <th className="p-3 w-20">Sev</th>
                            <th className="p-3">Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {logs.map((log, idx) => (
                            <tr
                                key={idx}
                                onClick={() => setSelectedLog(log)}
                                className="hover:bg-gray-800/50 transition-colors group cursor-pointer"
                            >
                                <td className="p-3 text-gray-600 font-mono">{idx + 1}</td>
                                <td className="p-3 text-gray-400 font-mono whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    })}
                                </td>
                                <td className="p-3 font-semibold text-gray-300">{log.source}</td>
                                <td className="p-3">
                                    <span className={`flex items-center gap-2 ${getSeverityClass(log.severity)}`}>
                                        {getSeverityIcon(log.severity)}
                                        {log.severity}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-300 font-mono break-all group-hover:text-white">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div className="bg-gray-950 border border-cyan-500/30 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col neon-border" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50">
                            <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Log Details
                            </h3>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white hover:bg-gray-800 p-1 rounded transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 overflow-y-auto space-y-4 text-sm font-mono custom-scrollbar">
                            {Object.entries(selectedLog).filter(([_, v]) => v !== null && v !== undefined && v !== "").map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 gap-4 border-b border-gray-900 pb-2 last:border-0 hover:bg-gray-900/30 p-1 rounded">
                                    <span className="text-gray-500 font-semibold uppercase text-xs tracking-wider self-center">{key.replace(/_/g, ' ')}</span>
                                    <span className="col-span-2 text-gray-300 break-words">
                                        {(key === 'raw_data' || typeof value === 'object') ? (
                                            <pre className="text-xs text-green-400 bg-gray-950 p-2 rounded overflow-x-auto border border-gray-900">
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
                        <div className="p-4 border-t border-gray-800 bg-gray-900/30 flex justify-end">
                            <button
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs uppercase tracking-wider transition-colors"
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
