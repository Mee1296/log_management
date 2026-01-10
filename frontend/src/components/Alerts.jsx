import React from 'react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

function Alerts({ alerts }) {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-gray-900/50 rounded-lg border border-gray-800">
                <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
                <p>No active alerts detected.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-950/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400 font-mono">
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Severity</th>
                            <th className="p-4">Source</th>
                            <th className="p-4">Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {alerts.map((alert, i) => (
                            <tr key={i} className="hover:bg-gray-800/50 transition-colors font-mono text-sm">
                                <td className="p-4 whitespace-nowrap text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(alert.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${alert.severity >= 8 ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                                            'bg-orange-500/20 text-orange-500'
                                        }`}>
                                        LEVEL {alert.severity}
                                    </span>
                                </td>
                                <td className="p-4 text-cyan-400">{alert.source}</td>
                                <td className="p-4 text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        {alert.message}
                                    </div>
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
