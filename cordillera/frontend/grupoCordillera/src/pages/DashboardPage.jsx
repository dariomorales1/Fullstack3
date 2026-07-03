import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../components/ui/Dropdown';
import { useDashboard } from '../hooks/useDashboard.js';
import { exportWorkbook } from '../utils/exportExcel.js';
import { formatCompactNumber, formatCurrency, formatDateTime, titleCase } from '../utils/formatters.js';
import {
    AlertTriangle,
    Download,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const periodOptions = ['Mes Actual', 'Mes Anterior', 'Ultimo Trimestre', 'Ano Actual'];
const categoryOptions = ['Todas las Categorias', 'Ventas', 'Inventario', 'Finanzas', 'Clientes'];

export const DashboardPage = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = React.useState('Mes Actual');
    const [category, setCategory] = React.useState('Todas las Categorias');
    const { data, loading, error, refetch } = useDashboard(period, category);

    const metrics = React.useMemo(() => {
        const directionMap = {
            up: { tone: 'text-emerald-600', icon: ArrowUpRight },
            down: { tone: 'text-rose-600', icon: ArrowDownRight },
            neutral: { tone: 'text-slate-500', icon: Minus },
        };

        return (data?.metrics || []).map((metric) => {
            const config = directionMap[metric.direction] || directionMap.neutral;
            let value = metric.value;

            if (metric.format === 'currency') {
                value = formatCurrency(metric.value);
            } else if (metric.format === 'percentage') {
                value = `${Number(metric.value ?? 0).toFixed(1)}%`;
            } else {
                value = formatCompactNumber(metric.value);
            }

            return {
                ...metric,
                value,
                tone: config.tone,
                icon: config.icon,
            };
        });
    }, [data]);

    const handleRefresh = () => {
        refetch();
    };

    const handleExport = () => {
        if (!data) {
            return;
        }

        exportWorkbook('dashboard-cordillera', [
            {
                name: 'Resumen',
                columns: ['Metrica', 'Valor', 'Detalle'],
                rows: (data.metrics || []).map((metric) => ({
                    Metrica: metric.title,
                    Valor: metric.value,
                    Detalle: metric.delta,
                })),
            },
            {
                name: 'Ventas por Sucursal',
                columns: ['Sucursal', 'Ventas'],
                rows: data.branchSales || [],
            },
            {
                name: 'Tendencia',
                columns: ['Periodo', 'Ventas'],
                rows: (data.revenueTrend || []).map((item) => ({
                    Periodo: item.name,
                    Ventas: item.ventas,
                })),
            },
            {
                name: 'Alertas',
                columns: ['Titulo', 'Categoria', 'Origen'],
                rows: (data.alerts || []).map((alert) => ({
                    Titulo: alert.title,
                    Categoria: alert.category,
                    Origen: alert.time,
                })),
            },
            {
                name: 'KPIs Dashboard',
                columns: ['Codigo', 'Nombre', 'Tipo', 'Valor Real', 'Meta', 'Cumplimiento', 'Estado'],
                rows: (data.dashboard?.kpis || []).map((kpi) => ({
                    Codigo: kpi.codigo,
                    Nombre: kpi.nombre,
                    Tipo: kpi.tipo,
                    'Valor Real': kpi.valorReal,
                    Meta: kpi.valorMeta,
                    Cumplimiento: kpi.porcentajeCumplimiento,
                    Estado: kpi.estado,
                })),
            },
            {
                name: 'Reportes Recientes',
                columns: ['Titulo', 'Tipo', 'Fecha Generacion', 'Estado'],
                rows: (data.dashboard?.reportesRecientes || []).map((report) => ({
                    Titulo: report.titulo,
                    Tipo: report.tipo,
                    'Fecha Generacion': formatDateTime(report.fechaGeneracion),
                    Estado: report.estado,
                })),
            },
        ]);
    };

    return (
        <div className="min-h-full bg-slate-50 p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex items-start gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 px-5 py-4 text-yellow-900">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">
                            Estado de ingesta: {titleCase(data?.dashboard?.summary?.estadoIngestion || 'sin informacion')}
                        </p>
                        <p className="text-sm text-yellow-800">
                            {data?.dashboard?.degraded
                                ? `Servicios degradados: ${(data.dashboard.serviciosDegradados || []).join(', ')}.`
                                : `Ultima consolidacion generada ${formatDateTime(data?.generatedAt)}.`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Dropdown label="Periodo" value={period} options={periodOptions} onChange={setPeriod} />
                        <Dropdown label="Categoria" value={category} options={categoryOptions} onChange={setCategory} />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            disabled={!data}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="inline-flex items-center rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <div key={metric.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                                <p className="mt-3 text-3xl font-bold text-slate-900">{metric.value}</p>
                                <div className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${metric.tone}`}>
                                    <Icon className="h-4 w-4" />
                                    <span>{metric.delta}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5">
                            <h2 className="text-lg font-semibold text-slate-900">Ventas por Sucursal</h2>
                            <p className="text-sm text-slate-500">Rendimiento comparado por sede principal.</p>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.branchSales || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" stroke="#64748b" />
                                    <YAxis stroke="#64748b" />
                                    <Tooltip />
                                    <Bar dataKey="ventas" fill="#2563eb" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5">
                            <h2 className="text-lg font-semibold text-slate-900">Tendencia 6 meses</h2>
                            <p className="text-sm text-slate-500">Evolucion consolidada del semestre.</p>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data?.revenueTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" stroke="#64748b" />
                                    <YAxis stroke="#64748b" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                    <section className="rounded-3xl bg-brand-dark p-6 text-white shadow-sm">
                        <p className="text-sm uppercase tracking-[0.2em] text-blue-200">Resumen Ejecutivo</p>
                        <h2 className="mt-3 text-2xl font-bold">{data?.executiveSummary?.title || 'Cargando resumen ejecutivo...'}</h2>
                        <p className="mt-3 max-w-3xl text-sm text-slate-300">
                            {data?.executiveSummary?.description || 'Esperando datos consolidados del sistema.'}
                        </p>
                        <button
                            onClick={() => navigate('/reports')}
                            className="mt-6 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            Ver Informe Completo
                        </button>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Alertas de Operacion</h2>
                            <p className="text-sm text-slate-500">Eventos que requieren seguimiento.</p>
                        </div>
                        <div className="space-y-3">
                            {(data?.alerts || []).length ? (data.alerts || []).map((alert) => (
                                <div key={alert.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="font-semibold text-slate-900">{alert.title}</p>
                                    <p className="mt-1 text-sm text-slate-500">{alert.time}</p>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                    No hay alertas activas para la categoria seleccionada.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
