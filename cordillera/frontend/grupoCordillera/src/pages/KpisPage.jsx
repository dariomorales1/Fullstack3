import React from 'react';
import { TrendingUp, SlidersHorizontal, Download } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';

const rows = [
    { code: 'FIN-001', name: 'EBITDA Consolidado', type: 'Financiero', actual: '4.2M', goal: '4.0M', compliance: '105%', status: 'CUMPLIDO' },
    { code: 'OPS-204', name: 'Disponibilidad de Red', type: 'Operativo', actual: '98.2%', goal: '99.5%', compliance: '98.7%', status: 'EN RIESGO' },
    { code: 'HHR-012', name: 'Tasa de Rotacion', type: 'RRHH', actual: '14.5%', goal: '8.0%', compliance: '55.2%', status: 'CRITICO' },
    { code: 'FIN-002', name: 'Flujo de Caja Libre', type: 'Financiero', actual: '1.8M', goal: '1.5M', compliance: '120%', status: 'CUMPLIDO' },
    { code: 'SUS-501', name: 'Emisiones de CO2', type: 'Sostenibilidad', actual: '450tn', goal: '480tn', compliance: '106.2%', status: 'CUMPLIDO' }
];

const kpiTypes = ['Todos', 'Financiero', 'Operativo', 'RRHH', 'Sostenibilidad'];
const periodOptions = ['Q1-2023', 'Q2-2023', 'Q3-2023', 'Q4-2023'];

const statusClassMap = {
    CUMPLIDO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    'EN RIESGO': 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    CRITICO: 'bg-red-50 text-red-700 ring-red-200'
};

export const KpisPage = () => {
    const [calculating, setCalculating] = React.useState(false);
    const [calculated, setCalculated] = React.useState(false);
    const [kpiTypeFilter, setKpiTypeFilter] = React.useState('Todos');
    const [period, setPeriod] = React.useState('Q3-2023');

    const handleCalculate = () => {
        setCalculating(true);
        setTimeout(() => {
            setCalculating(false);
            setCalculated(true);
        }, 1500);
    };

    const filteredRows = kpiTypeFilter === 'Todos'
        ? rows
        : rows.filter((row) => row.type === kpiTypeFilter);

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
                        <p className="mt-1 text-sm text-slate-500">Vista consolidada de desempeno por area con datos estaticos.</p>
                    </div>
                    <button
                        onClick={handleCalculate}
                        className="inline-flex items-center self-start rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm"
                    >
                        <TrendingUp className={`mr-2 h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
                        Calcular KPIs
                    </button>
                </div>

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
                                {filteredRows.map((row) => (
                                    <tr key={row.code}>
                                        <td className="px-4 py-4 font-semibold text-slate-900">{row.code}</td>
                                        <td className="px-4 py-4">{row.name}</td>
                                        <td className="px-4 py-4">{row.type}</td>
                                        <td className="px-4 py-4">{row.actual}</td>
                                        <td className="px-4 py-4">{row.goal}</td>
                                        <td className="px-4 py-4 font-medium">{row.compliance}</td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassMap[row.status]}`}>
                                                {row.status}
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
                        <p className="mt-3 text-3xl font-bold text-slate-900">82.4%</p>
                        <p className="mt-2 text-sm font-semibold text-emerald-600">+4.2% vs Q2</p>
                        <div className="mt-4 h-3 rounded-full bg-slate-200">
                            <div className="h-3 rounded-full bg-blue-600" style={{ width: '82.4%' }} />
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">KPIs en Alerta</p>
                        <p className="mt-3 text-3xl font-bold text-red-600">03</p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">Indicadores Criticos</p>
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
                        <p className="mt-3 text-4xl font-bold">94.1</p>
                        <p className="mt-2 text-sm text-slate-300">Puntaje Holding</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
