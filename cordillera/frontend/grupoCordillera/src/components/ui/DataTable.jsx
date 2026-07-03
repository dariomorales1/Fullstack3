import React from 'react';

export const DataTable = ({ columns, data, loading, emptyMessage = 'No hay registros disponibles.' }) => {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} className="px-4 py-4">{col.header}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                    {loading && (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                                Cargando datos...
                            </td>
                        </tr>
                    )}

                    {!loading && !data.length && (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}

                    {!loading && data.map((row, rowIndex) => (
                        <tr key={row.id || rowIndex}>
                            {columns.map((col, colIndex) => (
                                <td key={colIndex} className="px-4 py-4">
                                    {/* Si la columna tiene una función render, la ejecutamos. Si no, mostramos el valor directo */}
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};