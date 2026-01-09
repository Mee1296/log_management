import React from 'react';

const SummaryCard = ({ title, value, icon: Icon, color = "text-cyan-400" }) => {
    return (
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center justify-between shadow-lg hover:border-cyan-500/50 transition-colors group">
            <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{title}</p>
                <span className={`text-2xl font-bold ${color} drop-shadow-sm`}>{value}</span>
            </div>
            {Icon && <Icon className={`w-8 h-8 ${color} opacity-50 group-hover:opacity-100 transition-opacity`} />}
        </div>
    );
};

export default SummaryCard;
