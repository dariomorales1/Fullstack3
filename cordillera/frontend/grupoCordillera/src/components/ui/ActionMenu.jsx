import React from 'react';
import { MoreHorizontal } from 'lucide-react';

export const ActionMenu = ({ isOpen, onToggle, actions }) => {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
                <MoreHorizontal className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="absolute right-4 top-10 z-10 w-36 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                                action.danger
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'hover:bg-slate-100 text-slate-700'
                            }`}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};