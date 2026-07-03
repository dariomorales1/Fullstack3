import React from 'react';
import { Plus, Search, SlidersHorizontal, RefreshCw, Download, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReports } from '../hooks/useReports.js';
import { exportWorkbook } from '../utils/exportExcel.js';
import { formatCompactNumber, formatDateTime, safeJsonParse, titleCase } from '../utils/formatters.js';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';

const statusClassMap = {
    GENERADO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    EN_PROCESO: 'bg-blue-50 text-blue-700 ring-blue-200',
    ERROR: 'bg-red-50 text-red-700 ring-red-200',
};

export const ReportsPage = () => {
    const { reports, loading, error, refetch, generateReport } = useReports();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showModal, setShowModal] = React.useState(false);
    const [reportType, setReportType] = React.useState('VENTAS_POR_SUCURSAL');

    const cards = [
        { title: 'Total Reportes', value: formatCompactNumber(reports.length), meta: 'Historial disponible', tone: 'text-emerald-600' },
        { title: 'Completados', value: formatCompactNumber(reports.filter((r) => r.estado === 'GENERADO').length), meta: 'Estado generado', tone: 'text-emerald-600' },
        { title: 'En Proceso', value: formatCompactNumber(reports.filter((r) => r.estado === 'EN_PROCESO').length), meta: 'Seguimiento activo', tone: 'text-blue-600' },
        { title: 'Fallidos', value: formatCompactNumber(reports.filter((r) => r.estado === 'ERROR').length), meta: 'Requieren revision', tone: 'text-red-600' },
    ];

    const filteredRows = reports.filter((r) =>
        r.titulo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const weekdays = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const chartMap = { DOM: 0, LUN: 0, MAR: 0, MIE: 0, JUE: 0, VIE: 0, SAB: 0 };
    reports.forEach((r) => {
        if (!r.fechaGeneracion) return;
        const day = weekdays[new Date(r.fechaGeneracion).getDay()];
        chartMap[day] += 1;
    });
    const chartData = weekdays.map((day) => ({ day, total: chartMap[day] }));

    const handleExportAll = () => {
        exportWorkbook('reportes-cordillera', [
            {
                name: 'Reportes',
                columns: ['Titulo', 'Tipo', 'Fecha', 'Estado', 'Parametros'],
                rows: filteredRows.map((r) => ({
                    Titulo: r.titulo,
                    Tipo: titleCase(r.tipo),
                    Fecha: formatDateTime(r.fechaGeneracion),
                    Estado: titleCase(r.estado),
                    Parametros: JSON.stringify(safeJsonParse(r.parametros, {})),
                })),
            },
            {
                name: 'Tendencia',
                columns: ['Dia', 'Total'],
                rows: chartData.map((r) => ({ Dia: r.day, Total: r.total })),
            },
        ]);
    };

    const handleExportReport = (report) => {
        exportWorkbook(`reporte-${report.id}`, [
            {
                name: 'Resumen',
                columns: ['Campo', 'Valor'],
                rows: [
                    { Campo: 'ID', Valor: report.id },
                    { Campo: 'Titulo', Valor: report.titulo },
                    { Campo: 'Tipo', Valor: titleCase(report.tipo) },
                    { Campo: 'Fecha Generacion', Valor: formatDateTime(report.fechaGeneracion) },
                    { Campo: 'Estado', Valor: titleCase(report.estado) },
                    { Campo: 'Parametros', Valor: JSON.stringify(safeJsonParse(report.parametros, {})) },
                ],
            },
            {
                name: 'Contenidos',
                columns: ['Seccion', 'Orden', 'Datos'],
                rows: (report.contenidos || []).map((item) => ({
                    Seccion: item.seccion,
                    Orden: item.orden,
                    Datos: item.datosJson,
                })),
            },
        ]);
    };

    const generateReportBtn = (
        <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Reporte
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Filtros
                        </button>
                        <button
                            onClick={handleExportAll}
                            disabled={!filteredRows.length}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </button>
                        <button onClick={refetch} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Recargar
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                            {error ? (
                                <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                            ) : null}
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
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">Cargando reportes...</td>
                                            </tr>
                                        ) : null}
                                        {!loading && !filteredRows.length ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">No hay reportes para la busqueda actual.</td>
                                            </tr>
                                        ) : null}
                                        {!loading && filteredRows.map((row) => (
                                            <tr key={row.id}>
                                                <td className="px-4 py-4 font-semibold text-slate-900">{row.titulo}</td>
                                                <td className="px-4 py-4">{titleCase(row.tipo)}</td>
                                                <td className="px-4 py-4">{formatDateTime(row.fechaGeneracion)}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassMap[row.estado] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                                                        {titleCase(row.estado)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {row.estado === 'GENERADO' ? (
                                                            <button
                                                                onClick={() => handleExportReport(row)}
                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </button>
                                                        ) : null}
                                                        {row.estado === 'ERROR' ? (
                                                            <button
                                                                onClick={refetch}
                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
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
                                Reportes generados: {reports.filter((r) => r.estado === 'GENERADO').length}. En error: {reports.filter((r) => r.estado === 'ERROR').length}.
                            </p>
                            <button
                                onClick={() => alert('Configurar alertas PRO pronto estara disponible.')}
                                className="mt-6 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-brand-dark transition hover:bg-slate-100"
                            >
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
                                        onChange={(e) => setReportType(e.target.value)}
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
