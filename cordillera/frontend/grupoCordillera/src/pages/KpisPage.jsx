import React from 'react';
import { TrendingUp, SlidersHorizontal, Download, X } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { exportWorkbook } from '../utils/exportExcel.js';
import { useKpis } from '../hooks/useKpis.js';
import { formatCompactNumber, titleCase } from '../utils/formatters.js';

const statusClassMap = {
    CUMPLIDO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    EN_RIESGO: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    CRITICO: 'bg-red-50 text-red-700 ring-red-200'
};

export const KpisPage = () => {
    const periodMap = {
        'Periodo 1': 1,
        'Periodo 2': 2,
        'Periodo 3': 3,
        'Periodo 4': 4,
    };
    const [calculating, setCalculating] = React.useState(false);
    const [calculated, setCalculated] = React.useState(false);
    const [kpiTypeFilter, setKpiTypeFilter] = React.useState('Todos');
    const [period, setPeriod] = React.useState('Periodo 1');
    const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
    const [advancedFilters, setAdvancedFilters] = React.useState({
        search: '',
        status: 'Todos',
        minCompliance: '0',
    });
    const [draftFilters, setDraftFilters] = React.useState({
        search: '',
        status: 'Todos',
        minCompliance: '0',
    });
    const { kpis, loading, error, refetch } = useKpis(periodMap[period]);

    const handleRefresh = async () => {
        setCalculating(true);
        try {
            await refetch();
            setCalculating(false);
            setCalculated(true);
        } catch {
            setCalculating(false);
        }
    };

    const kpiTypes = ['Todos', ...new Set(kpis.map((row) => titleCase(row.tipo)).filter(Boolean))];
    const periodOptions = Object.keys(periodMap);
    const advancedStatusOptions = ['Todos', ...new Set(kpis.map((row) => titleCase(row.resultado?.estado)).filter(Boolean))];

    const typeFilteredRows = kpiTypeFilter === 'Todos'
        ? kpis
        : kpis.filter((row) => titleCase(row.tipo) === kpiTypeFilter);

    const filteredRows = typeFilteredRows.filter((row) => {
        const matchesSearch = !advancedFilters.search
            || row.nombre?.toLowerCase().includes(advancedFilters.search.toLowerCase())
            || row.codigo?.toLowerCase().includes(advancedFilters.search.toLowerCase());
        const matchesStatus = advancedFilters.status === 'Todos'
            || titleCase(row.resultado?.estado) === advancedFilters.status;
        const compliance = Number(row.resultado?.porcentajeCumplimiento ?? 0);
        const matchesCompliance = compliance >= Number(advancedFilters.minCompliance ?? 0);
        return matchesSearch && matchesStatus && matchesCompliance;
    });

    const completedCount = kpis.filter((row) => row.resultado?.estado === 'CUMPLIDO').length;
    const riskCount = kpis.filter((row) => row.resultado?.estado === 'EN_RIESGO').length;
    const avgCompliance = kpis.length
        ? Math.round(kpis.reduce((acc, row) => acc + Number(row.resultado?.porcentajeCumplimiento ?? 0), 0) / kpis.length)
        : 0;

    const handleExport = () => {
        exportWorkbook('kpis-cordillera', [
            {
                name: 'KPIs',
                columns: ['Codigo', 'Nombre', 'Tipo', 'Unidad', 'Valor Real', 'Meta', 'Cumplimiento', 'Estado'],
                rows: filteredRows.map((row) => ({
                    Codigo: row.codigo,
                    Nombre: row.nombre,
                    Tipo: titleCase(row.tipo),
                    Unidad: row.unidad || 'N/D',
                    'Valor Real': row.resultado?.valorReal ?? row.valorReal ?? '',
                    Meta: row.valorMeta ?? '',
                    Cumplimiento: row.resultado?.porcentajeCumplimiento ?? '',
                    Estado: row.resultado?.estado ? titleCase(row.resultado.estado) : 'Sin resultado',
                })),
            },
        ]);
    };

    const applyAdvancedFilters = () => {
        setAdvancedFilters(draftFilters);
        setShowAdvancedFilters(false);
    };

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-bold">Gestion de Indicadores KPIs</h1>
                            {calculated ? (
                                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                    KPIs actualizados
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">Vista consolidada de indicadores consumida desde ms-kpis.</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center self-start rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm"
                    >
                        <TrendingUp className={`mr-2 h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
                        Actualizar KPIs
                    </button>
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Dropdown label="Tipo de KPI" value={kpiTypeFilter} options={kpiTypes} onChange={setKpiTypeFilter} />
                        <Dropdown label="Periodo" value={period} options={periodOptions} onChange={setPeriod} />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowAdvancedFilters(true)} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Filtros Avanzados
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={!filteredRows.length}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <h2 className="text-lg font-semibold text-slate-900">Resultados Consolidados</h2>
                    </div>
                    {error ? (
                        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                    ) : null}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-4">Codigo</th>
                                    <th className="px-4 py-4">Nombre</th>
                                    <th className="px-4 py-4">Tipo</th>
                                    <th className="px-4 py-4">Valor Real</th>
                                    <th className="px-4 py-4">Meta</th>
                                    <th className="px-4 py-4">Cumplimiento</th>
                                    <th className="px-4 py-4">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">Cargando KPIs...</td>
                                    </tr>
                                ) : null}
                                {!loading && !filteredRows.length ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">No hay KPIs para el periodo seleccionado.</td>
                                    </tr>
                                ) : null}
                                {!loading && filteredRows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-4 font-semibold text-slate-900">{row.codigo}</td>
                                        <td className="px-4 py-4">{row.nombre}</td>
                                        <td className="px-4 py-4">{titleCase(row.tipo)}</td>
                                        <td className="px-4 py-4">{row.resultado?.valorReal ?? 'Sin resultado'}</td>
                                        <td className="px-4 py-4">{row.unidad || 'N/D'}</td>
                                        <td className="px-4 py-4 font-medium">
                                            {row.resultado?.porcentajeCumplimiento != null ? `${Number(row.resultado.porcentajeCumplimiento).toFixed(1)}%` : 'N/D'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassMap[row.resultado?.estado] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                                                {row.resultado?.estado ? titleCase(row.resultado.estado) : 'Sin resultado'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Meta Trimestral</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{avgCompliance}%</p>
                        <p className="mt-2 text-sm font-semibold text-emerald-600">Promedio de cumplimiento</p>
                        <div className="mt-4 h-3 rounded-full bg-slate-200">
                            <div className="h-3 rounded-full bg-blue-600" style={{ width: `${Math.min(avgCompliance, 100)}%` }} />
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">KPIs en Alerta</p>
                        <p className="mt-3 text-3xl font-bold text-red-600">{formatCompactNumber(riskCount)}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">Indicadores en riesgo</p>
                        <div className="mt-4 space-y-2">
                            <div className="h-2 rounded-full bg-red-200">
                                <div className="h-2 w-4/5 rounded-full bg-red-500" />
                            </div>
                            <div className="h-2 rounded-full bg-red-200">
                                <div className="h-2 w-2/3 rounded-full bg-red-500" />
                            </div>
                            <div className="h-2 rounded-full bg-red-200">
                                <div className="h-2 w-1/2 rounded-full bg-red-500" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-brand-dark p-5 text-white shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">Eficiencia Global</p>
                        <p className="mt-3 text-4xl font-bold">{formatCompactNumber(completedCount)}</p>
                        <p className="mt-2 text-sm text-slate-300">KPIs cumplidos</p>
                    </div>
                </div>
            </div>

            {showAdvancedFilters ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Filtros Avanzados</h2>
                            <button onClick={() => setShowAdvancedFilters(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mt-5 grid gap-4">
                            <label className="text-sm font-medium text-slate-700">
                                Buscar por codigo o nombre
                                <input value={draftFilters.search} onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                                Estado
                                <select value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none">
                                    {advancedStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                                Cumplimiento minimo
                                <input type="number" min="0" max="200" value={draftFilters.minCompliance} onChange={(event) => setDraftFilters((current) => ({ ...current, minCompliance: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                        </div>
                        <button onClick={applyAdvancedFilters} className="mt-6 w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white">
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
