import React from 'react';
import { Plus, Search, SlidersHorizontal, CalendarDays, Eye, Download, RefreshCw, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const cards = [
    { title: 'Total Reportes', value: '1284', meta: '+12%', tone: 'text-emerald-600' },
    { title: 'Completados', value: '1240', meta: '96.5%', tone: 'text-emerald-600' },
    { title: 'En Proceso', value: '38', meta: 'Seguimiento activo', tone: 'text-blue-600' },
    { title: 'Fallidos', value: '6', meta: 'Requieren revision', tone: 'text-red-600' }
];

const rows = [
    { title: 'Estado Financiero Q3 2023', type: 'Financiero', date: 'Oct15', status: 'COMPLETADO', statusClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200', actions: 'download' },
    { title: 'Inventario Consolidado Norte', type: 'Logistica', date: 'Oct22', status: 'EN PROCESO', statusClass: 'bg-blue-50 text-blue-700 ring-blue-200', actions: 'disabled' },
    { title: 'Auditoria Fiscal Anual 2022', type: 'Auditoria', date: 'Oct20', status: 'FALLIDO', statusClass: 'bg-red-50 text-red-700 ring-red-200', actions: 'refresh' },
    { title: 'Desempeno RH Trimestral', type: 'RRHH', date: 'Oct19', status: 'COMPLETADO', statusClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200', actions: 'download' }
];

const chartData = [
    { day: 'LUN', total: 12 },
    { day: 'MAR', total: 19 },
    { day: 'MIE', total: 8 },
    { day: 'JUE', total: 25 },
    { day: 'VIE', total: 31 },
    { day: 'SAB', total: 14 },
    { day: 'DOM', total: 7 }
];

export const ReportsPage = () => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showModal, setShowModal] = React.useState(false);
    const [reportType, setReportType] = React.useState('Financiero');

    const filteredRows = rows.filter((row) =>
        row.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Centro de Reportes</h1>
                        <p className="mt-1 text-sm text-slate-500">Centro estatico de generacion y seguimiento documental.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center self-start rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Generar Nuevo Reporte
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">{card.title}</p>
                            <p className="mt-3 text-3xl font-bold">{card.value}</p>
                            <p className={`mt-3 text-sm font-semibold ${card.tone}`}>{card.meta}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <Search className="mr-3 h-4 w-4 text-slate-400" />
                        <input
                            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                            placeholder="Buscar reportes"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Filtros
                        </button>
                        <button className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Ultimos 30 dias
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        <tr>
                                            <th className="px-4 py-4">Titulo</th>
                                            <th className="px-4 py-4">Tipo</th>
                                            <th className="px-4 py-4">Fecha</th>
                                            <th className="px-4 py-4">Estado</th>
                                            <th className="px-4 py-4">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                                        {filteredRows.map((row) => (
                                            <tr key={row.title}>
                                                <td className="px-4 py-4 font-semibold text-slate-900">{row.title}</td>
                                                <td className="px-4 py-4">{row.type}</td>
                                                <td className="px-4 py-4">{row.date}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${row.statusClass}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => alert(`Ver reporte: ${row.title}`)}
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        {row.actions === 'download' ? (
                                                            <button
                                                                onClick={() => alert(`Descargar reporte: ${row.title}`)}
                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </button>
                                                        ) : null}
                                                        {row.actions === 'refresh' ? (
                                                            <button
                                                                onClick={() => alert(`Reintentar generacion: ${row.title}`)}
                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                            </button>
                                                        ) : null}
                                                        {row.actions === 'disabled' ? (
                                                            <button
                                                                onClick={() => alert(`Reporte en proceso: ${row.title}`)}
                                                                className="rounded-lg p-2 text-slate-300"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-slate-900">Tendencia de Generacion</h2>
                                <p className="text-sm text-slate-500">Actividad de los ultimos 7 dias.</p>
                            </div>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="day" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip />
                                        <Bar dataKey="total" fill="#2563eb" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <aside className="rounded-3xl bg-brand-dark p-6 text-white shadow-sm">
                        <p className="text-sm uppercase tracking-[0.2em] text-blue-200">Suscripcion Premium</p>
                        <h2 className="mt-3 text-2xl font-bold">Automatiza entregas y alertas ejecutivas.</h2>
                        <p className="mt-3 text-sm text-slate-300">
                            Configura notificaciones proactivas para estados fallidos, cargas masivas y ventanas de publicacion.
                        </p>
                        <button className="mt-6 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-brand-dark transition hover:bg-slate-100">
                            Configurar Alertas Pro
                        </button>
                    </aside>
                </div>

                {showModal ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900">Nuevo Reporte</h2>
                                <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="mt-5 space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tipo de reporte</label>
                                    <select
                                        value={reportType}
                                        onChange={(event) => setReportType(event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                                    >
                                        <option value="Financiero">Financiero</option>
                                        <option value="Logistica">Logistica</option>
                                        <option value="Auditoria">Auditoria</option>
                                        <option value="RRHH">RRHH</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        alert(`Generando reporte de tipo ${reportType}`);
                                        setShowModal(false);
                                    }}
                                    className="w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white"
                                >
                                    Generar
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
