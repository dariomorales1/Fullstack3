import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../components/ui/Dropdown';
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

const branchSales = [
    { name: 'STGO', ventas: 180 },
    { name: 'VALP', ventas: 120 },
    { name: 'CONC', ventas: 90 },
    { name: 'ANTO', ventas: 60 }
];

const revenueTrend = [
    { name: 'ENE', ventas: 320 },
    { name: 'FEB', ventas: 380 },
    { name: 'MAR', ventas: 350 },
    { name: 'ABR', ventas: 410 },
    { name: 'MAY', ventas: 430 },
    { name: 'JUN', ventas: 450 }
];

const periodOptions = ['Mes Actual', 'Mes Anterior', 'Ultimo Trimestre', 'Ano Actual'];
const categoryOptions = ['Todas las Categorias', 'Ventas', 'Inventario', 'Finanzas', 'Clientes'];

const metrics = [
    { title: 'Ventas Totales', value: 'CLP 450M', delta: '+12%', tone: 'text-emerald-600', icon: ArrowUpRight },
    { title: 'Inventario Valorizado', value: 'CLP 1.2B', delta: '-5%', tone: 'text-rose-600', icon: ArrowDownRight },
    { title: 'Margen Financiero', value: '18.5%', delta: 'Estable', tone: 'text-slate-500', icon: Minus },
    { title: 'Clientes Activos', value: '1250', delta: '+3%', tone: 'text-emerald-600', icon: ArrowUpRight }
];

const alerts = [
    { title: 'Stock Critico Bodega Central', time: 'Hace 2h' },
    { title: 'Proxima Junta de Directorio', time: 'Manana' }
];

export const DashboardPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [period, setPeriod] = React.useState('Mes Actual');
    const [category, setCategory] = React.useState('Todas las Categorias');

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1200);
    };

    return (
        <div className="min-h-full bg-slate-50 p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex items-start gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 px-5 py-4 text-yellow-900">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Alerta de sincronizacion Antofagasta</p>
                        <p className="text-sm text-yellow-800">La ultima sincronizacion de inventario para Antofagasta presenta desfase operativo.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Dropdown label="Periodo" value={period} options={periodOptions} onChange={setPeriod} />
                        <Dropdown label="Categoria" value={category} options={categoryOptions} onChange={setCategory} />
                    </div>
                    <div className="flex gap-3">
                        <button className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300">
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
                                <BarChart data={branchSales}>
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
                                <LineChart data={revenueTrend}>
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
                        <h2 className="mt-3 text-2xl font-bold">El holding mantiene crecimiento comercial con presion acotada en inventario.</h2>
                        <p className="mt-3 max-w-3xl text-sm text-slate-300">
                            Santiago y Valparaiso sostienen el alza semestral, mientras Antofagasta requiere intervencion operativa para regularizar sincronizacion y abastecimiento.
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
                            {alerts.map((alert) => (
                                <div key={alert.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="font-semibold text-slate-900">{alert.title}</p>
                                    <p className="mt-1 text-sm text-slate-500">{alert.time}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
