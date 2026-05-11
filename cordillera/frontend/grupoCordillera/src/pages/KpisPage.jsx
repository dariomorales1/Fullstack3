import React from 'react';
import { TrendingUp, SlidersHorizontal, Download } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { useKpis } from '../hooks/useKpis.js';
import { formatCompactNumber, titleCase } from '../utils/formatters.js';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';

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

    const filteredRows = kpiTypeFilter === 'Todos'
        ? kpis
        : kpis.filter((row) => titleCase(row.tipo) === kpiTypeFilter);

    const completedCount = kpis.filter((row) => row.resultado?.estado === 'CUMPLIDO').length;
    const riskCount = kpis.filter((row) => row.resultado?.estado === 'EN_RIESGO').length;
    const avgCompliance = kpis.length
        ? Math.round(kpis.reduce((acc, row) => acc + Number(row.resultado?.porcentajeCumplimiento ?? 0), 0) / kpis.length)
        : 0;

    const columns = [
        {
            header: 'Codigo',
            render: (row) => <span className="font-semibold text-slate-900">{row.codigo}</span>
        },
        { header: 'Nombre', accessor: 'nombre' },
        {
            header: 'Tipo',
            render: (row) => titleCase(row.tipo)
        },
        {
            header: 'Valor Real',
            render: (row) => row.resultado?.valorReal ?? 'Sin resultado'
        },
        {
            header: 'Meta',
            render: (row) => row.unidad || 'N/D'
        },
        {
            header: 'Cumplimiento',
            render: (row) => row.resultado?.porcentajeCumplimiento != null
                ? `${Number(row.resultado.porcentajeCumplimiento).toFixed(1)}%`
                : 'N/D'
        },
        {
            header: 'Estado',
            render: (row) => <StatusBadge status={row.resultado?.estado || 'Sin resultado'} />
        }
    ];

    const refreshBtn = (
        <button
            onClick={handleRefresh}
            className="inline-flex items-center self-start rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
            <TrendingUp className={`mr-2 h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
            Actualizar KPIs
        </button>
    );

    const CustomTitle = (
        <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">Gestion de Indicadores KPIs</h1>
            {calculated && (
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    KPIs actualizados
                </span>
            )}
        </div>
    );

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">

                <PageHeader
                    title={CustomTitle}
                    subtitle="Vista consolidada de indicadores consumida desde ms-kpis."
                    actionButton={refreshBtn}
                />

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Dropdown label="Tipo de KPI" value={kpiTypeFilter} options={kpiTypes} onChange={setKpiTypeFilter} />
                        <Dropdown label="Periodo" value={period} options={periodOptions} onChange={setPeriod} />
                    </div>
                    <div className="flex gap-3">
                        <button className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Filtros Avanzados
                        </button>
                        <button className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <h2 className="text-lg font-semibold text-slate-900">Resultados Consolidados</h2>
                    </div>

                    {error && (
                        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                    )}

                    <DataTable
                        columns={columns}
                        data={filteredRows}
                        loading={loading}
                        emptyMessage="No hay KPIs para el periodo seleccionado."
                    />
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
        </div>
    );
};