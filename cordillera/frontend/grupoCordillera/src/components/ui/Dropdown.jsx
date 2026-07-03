import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Dropdown = ({ label, value, options, onChange, className = '' }) => {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);

    React.useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="inline-flex min-w-[160px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
                <span>{label ? `${label}: ` : ''}{value}</span>
                <ChevronDown size={16} className={`${open ? 'rotate-180' : ''} transition-transform`} />
            </button>
            {open && (
                <ul className="absolute left-0 top-full mt-1 z-50 min-w-full rounded-xl border border-slate-200 bg-white shadow-lg py-1 overflow-hidden">
                    {options.map((opt) => (
                        <li key={opt}>
                            <button
                                onClick={() => { onChange(opt); setOpen(false); }}
                                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                                    opt === value ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-700'
                                }`}
                            >
                                {opt}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
