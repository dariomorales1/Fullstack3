import React from 'react';
import { titleCase } from '../../utils/formatters';

const DEFAULT_MAP = {
    SUCCESS: ['COMPLETED', 'COMPLETADA', 'GENERADO', 'CUMPLIDO', 'IN STOCK'],
    WARNING: ['PENDING', 'PENDIENTE', 'EN_RIESGO', 'LOW STOCK'],
    DANGER: ['FLAGGED', 'ANULADA', 'ERROR', 'CRITICO'],
    INFO: ['EN_PROCESO']
};

export const StatusBadge = ({ status }) => {
    const normalizedStatus = status?.toUpperCase();

    let colorClass = 'bg-slate-100 text-slate-600 ring-slate-200';

    if (DEFAULT_MAP.SUCCESS.includes(normalizedStatus)) {
        colorClass = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    } else if (DEFAULT_MAP.WARNING.includes(normalizedStatus)) {
        colorClass = 'bg-yellow-50 text-yellow-700 ring-yellow-200';
    } else if (DEFAULT_MAP.DANGER.includes(normalizedStatus)) {
        colorClass = 'bg-red-50 text-red-700 ring-red-200';
    } else if (DEFAULT_MAP.INFO.includes(normalizedStatus)) {
        colorClass = 'bg-blue-50 text-blue-700 ring-blue-200';
    }

    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${colorClass}`}>
            {titleCase(status)}
        </span>
    );
};