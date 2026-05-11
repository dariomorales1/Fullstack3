// src/components/layout/PageHeader.jsx
import React from 'react';

export const PageHeader = ({ title, subtitle, actionButton }) => {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            {actionButton && (
                <div className="self-start">
                    {actionButton}
                </div>
            )}
        </div>
    );
};