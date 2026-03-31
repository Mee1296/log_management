import React from 'react';

const SummaryCard = ({ title, value, icon: Icon, color = "text-brand-accent" }) => {
    return (
        <div className="bg-[#130924] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-2xl hover:border-brand-purple/40 hover:bg-[#1a0d33] hover:-translate-y-1 transition-all duration-300 group">
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 group-hover:text-gray-400 transition-colors">{title}</p>
                <span className={`text-3xl font-black ${color} drop-shadow-[0_0_10px_rgba(124,58,237,0.3)]`}>{value}</span>
            </div>
            {Icon && <Icon className={`w-10 h-10 ${color} opacity-20 group-hover:opacity-100 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all duration-300`} />}
        </div>
    );
};

export default SummaryCard;
