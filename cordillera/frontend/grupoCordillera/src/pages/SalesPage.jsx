import React from 'react';
import { Plus, CalendarDays, Building2, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { useSales } from '../hooks/useSales.js';
import { formatCompactNumber, formatCurrency, formatDate, titleCase } from '../utils/formatters.js';

const statusClassMap = {
    COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    COMPLETADA: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    PENDING: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    PENDIENTE: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    FLAGGED: 'bg-red-50 text-red-700 ring-red-200',
    ANULADA: 'bg-red-50 text-red-700 ring-red-200'
};

const FilterButton = ({ icon: Icon, label, onClick }) => (
    <button onClick={onClick} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
        <Icon className="mr-2 h-4 w-4 text-slate-400" />
        {label}
    </button>
);

export const SalesPage = () => {
    const { sales, loading, error } = useSales();
    const [statusFilter, setStatusFilter] = React.useState('All');
    const [openMenuId, setOpenMenuId] = React.useState(null);

    const statusOptions = ['All', ...new Set(sales.map((row) => titleCase(row.status)).filter(Boolean))];

    const summaryCards = [
        { title: 'Ingresos Totales', value: formatCurrency(sales.reduce((acc, row) => acc + Number(row.amount ?? 0), 0)), meta: 'Ventas registradas', tone: 'text-emerald-600' },
        { title: 'Total Ordenes', value: formatCompactNumber(sales.length), meta: 'Operaciones cargadas', tone: 'text-slate-500' },
        { title: 'Sucursales Activas', value: String(new Set(sales.map((row) => row.branchId).filter(Boolean)).size), meta: 'Con ventas emitidas', tone: 'text-slate-500' },
        { title: 'Ticket Promedio', value: formatCurrency(sales.length ? sales.reduce((acc, row) => acc + Number(row.amount ?? 0), 0) / sales.length : 0), meta: 'Promedio por venta', tone: 'text-emerald-600' }
    ];

    const filteredSales = statusFilter === 'All'
        ? sales
        : sales.filter((row) => titleCase(row.status) === statusFilter);

    const toggleMenu = (id) => {
        setOpenMenuId((current) => (current === id ? null : id));
    };

    const handleMenuAction = (action, row) => {
        alert(`${action}: ${row.id} - ${row.customer}`);
        setOpenMenuId(null);
    };

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Sales Records</h1>
                        <p className="mt-1 text-sm text-slate-500">Ventas reales consumidas desde el microservicio de ventas.</p>
                    </div>
                    <button
                        onClick={() => alert('Funcionalidad de nueva venta en desarrollo')}
                        className="inline-flex items-center self-start rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Sale
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">{card.title}</p>
                            <p className="mt-3 text-3xl font-bold">{card.value}</p>
                            <p className={`mt-3 text-sm font-semibold ${card.tone}`}>{card.meta}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <FilterButton icon={CalendarDays} label="Date Range" onClick={() => alert('Filtro de fechas estatico')} />
                        <FilterButton icon={Building2} label="Branch" onClick={() => alert('Filtro de sucursal estatico')} />
                        <Dropdown label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                        {error ? (
                            <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                        ) : null}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        <th className="px-4 py-4">ID</th>
                                        <th className="px-4 py-4">Date</th>
                                        <th className="px-4 py-4">Customer</th>
                                        <th className="px-4 py-4">Branch</th>
                                        <th className="px-4 py-4">Amount</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">Cargando ventas...</td>
                                        </tr>
                                    ) : null}
                                    {!loading && !filteredSales.length ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">No hay ventas disponibles para este filtro.</td>
                                        </tr>
                                    ) : null}
                                    {!loading && filteredSales.map((row) => (
                                        <tr key={row.id} className="text-sm text-slate-700">
                                            <td className="px-4 py-4 font-semibold text-slate-900">SL-{row.id}</td>
                                            <td className="px-4 py-4">{formatDate(row.date)}</td>
                                            <td className="px-4 py-4">Cliente #{row.customerId ?? 'N/D'}</td>
                                            <td className="px-4 py-4">Sucursal #{row.branchId ?? 'N/D'}</td>
                                            <td className="px-4 py-4 font-medium">{formatCurrency(row.amount)}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassMap[row.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                                                    {titleCase(row.status)}
                                                </span>
                                            </td>
                                            <td className="relative px-4 py-4">
                                                <button
                                                    onClick={() => toggleMenu(row.id)}
                                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                                {openMenuId === row.id ? (
                                                    <div className="absolute right-4 top-14 z-10 w-36 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                                                        <button onClick={() => handleMenuAction('Ver Detalle', row)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100">Ver Detalle</button>
                                                        <button onClick={() => handleMenuAction('Editar', row)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100">Editar</button>
                                                        <button onClick={() => handleMenuAction('Eliminar', row)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                                                    </div>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                            <span>Mostrando {filteredSales.length} de {sales.length} ventas</span>
                            <div className="flex items-center gap-2">
                                <button className="rounded-lg border border-slate-200 p-2 text-slate-500"><ChevronLeft className="h-4 w-4" /></button>
                                <button className="rounded-lg border border-slate-200 p-2 text-slate-500"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>

                    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm xl:self-end">
                        <h2 className="text-lg font-semibold text-slate-900">Audit Summary</h2>
                        <div className="mt-5 space-y-4">
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-500">Ventas completadas</p>
                                <p className="mt-2 text-3xl font-bold text-emerald-600">
                                    {sales.length ? `${Math.round((sales.filter((row) => ['COMPLETED', 'COMPLETADA'].includes(row.status)).length / sales.length) * 100)}%` : '0%'}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-500">Metodo principal</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                    {titleCase(sales[0]?.paymentMethod) || 'Sin datos'}
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
