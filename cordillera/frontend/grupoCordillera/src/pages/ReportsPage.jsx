import React from 'react';
import { Plus, Search, SlidersHorizontal, CalendarDays, Eye, Download, RefreshCw, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReports } from '../hooks/useReports.js';
import { formatCompactNumber, formatDateTime, safeJsonParse, titleCase } from '../utils/formatters.js';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';

export const ReportsPage = () => {
    const { reports, loading, error, refetch, generateReport } = useReports();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showModal, setShowModal] = React.useState(false);
    const [reportType, setReportType] = React.useState('VENTAS_POR_SUCURSAL');

    const cards = [
        { title: 'Total Reportes', value: formatCompactNumber(reports.length), meta: 'Historial disponible', tone: 'text-emerald-600' },
        { title: 'Completados', value: formatCompactNumber(reports.filter((row) => row.estado === 'GENERADO').length), meta: 'Estado generado', tone: 'text-emerald-600' },
        { title: 'En Proceso', value: formatCompactNumber(reports.filter((row) => row.estado === 'EN_PROCESO').length), meta: 'Seguimiento activo', tone: 'text-blue-600' },
        { title: 'Fallidos', value: formatCompactNumber(reports.filter((row) => row.estado === 'ERROR').length), meta: 'Requieren revision', tone: 'text-red-600' }
    ];

    const filteredRows = reports.filter((row) =>
        row.titulo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const weekdays = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const chartMap = { DOM: 0, LUN: 0, MAR: 0, MIE: 0, JUE: 0, VIE: 0, SAB: 0 };
    reports.forEach((report) => {
        if (!report.fechaGeneracion) return;
        const day = weekdays[new Date(report.fechaGeneracion).getDay()];
        chartMap[day] += 1;
    });
    const chartData = weekdays.map((day) => ({ day, total: chartMap[day] }));

    const columns = [
        {
            header: 'Titulo',
            render: (row) => <span className="font-semibold text-slate-900">{row.titulo}</span>
        },
        {
            header: 'Tipo',
            render: (row) => titleCase(row.tipo)
        },
        {
            header: 'Fecha',
            render: (row) => formatDateTime(row.fechaGeneracion)
        },
        {
            header: 'Estado',
            render: (row) => <StatusBadge status={row.estado} />
        },
        {
            header: 'Acciones',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => alert(`Parametros: ${JSON.stringify(safeJsonParse(row.parametros, {}), null, 2)}`)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <Eye className="h-4 w-4" />
                    </button>

                    {row.estado === 'GENERADO' && (
                        <button
                            onClick={() => alert(`Descarga documental aun no implementada para ${row.titulo}`)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                    )}

                    {row.estado === 'ERROR' && (
                        <button
                            onClick={refetch}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    )}

                    {row.estado === 'EN_PROCESO' && (
                        <button
                            onClick={() => alert(`Reporte en proceso: ${row.titulo}`)}
                            className="rounded-lg p-2 text-slate-300"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    const generateReportBtn = (
        <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
            <Plus className="mr-2 h-4 w-4" />
            Generar Nuevo Reporte
        </button>
    );

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">

                <PageHeader
                    title="Centro de Reportes"
                    subtitle="Listado y generacion conectados al servicio de reportes via BFF."
                    actionButton={generateReportBtn}
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <KpiCard key={card.title} {...card} />
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
                        <button onClick={refetch} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Recargar
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
                    <div className="space-y-0">
                        {error && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <DataTable
                            columns={columns}
                            data={filteredRows}
                            loading={loading}
                            emptyMessage="No hay reportes para la busqueda actual."
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-slate-900">Tendencia de Generacion</h2>
                                <p className="text-sm text-slate-500">Actividad agregada por dia de semana.</p>
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

                        <aside className="rounded-3xl bg-brand-dark p-6 text-white shadow-sm">
                            <p className="text-sm uppercase tracking-[0.2em] text-blue-200">Suscripcion Premium</p>
                            <h2 className="mt-3 text-2xl font-bold">Estados reales del flujo documental.</h2>
                            <p className="mt-3 text-sm text-slate-300">
                                Reportes generados: {reports.filter((row) => row.estado === 'GENERADO').length}. En error: {reports.filter((row) => row.estado === 'ERROR').length}.
                            </p>
                            <button className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-brand-dark transition hover:bg-slate-100">
                                Configurar Alertas Pro
                            </button>
                        </aside>
                    </div>
                </div>

                {showModal && (
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
                                        <option value="VENTAS_POR_SUCURSAL">Ventas por sucursal</option>
                                        <option value="INVENTARIO_CONSOLIDADO">Inventario consolidado</option>
                                        <option value="KPI_MENSUAL">KPI mensual</option>
                                        <option value="BALANCE_FINANCIERO">Balance financiero</option>
                                    </select>
                                </div>
                                <button
                                    onClick={async () => {
                                        await generateReport({
                                            tipo: reportType,
                                            titulo: `Reporte ${titleCase(reportType)} ${new Date().toLocaleDateString('es-CL')}`,
                                            parametros: JSON.stringify({ generadoDesdeFrontend: true }),
                                        });
                                        setShowModal(false);
                                    }}
                                    className="w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                                >
                                    Generar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};