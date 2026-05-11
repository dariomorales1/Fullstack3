import React from 'react';

export const KpiCard = ({ title, value, meta, tone = 'text-slate-500', icon: Icon }) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                {Icon && <Icon className="h-5 w-5 text-slate-400" />}
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
            <p className={`mt-3 text-sm font-semibold ${tone}`}>{meta}</p>
        </div>
    );
};