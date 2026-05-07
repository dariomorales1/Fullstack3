import React from 'react';
import { Plus, CalendarDays, Building2, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';

const summaryCards = [
    { title: 'Total Revenue', value: '1.24M', meta: '+12.5%', tone: 'text-emerald-600' },
    { title: 'Total Orders', value: '8492', meta: '+3.2%', tone: 'text-emerald-600' },
    { title: 'Active Branches', value: '12', meta: 'Stable', tone: 'text-slate-500' },
    { title: 'Avg Order Value', value: '146', meta: '-1.1%', tone: 'text-rose-600' }
];

const salesData = [
    { id: 'SL-24890', date: 'Jan24', customer: 'Andina Corp', branch: 'North Region HQ', amount: '12450', status: 'COMPLETED' },
    { id: 'SL-24891', date: 'Jan24', customer: 'Sierra Logistics', branch: 'Coastal Distribution', amount: '5200.50', status: 'PENDING' },
    { id: 'SL-24892', date: 'Jan23', customer: 'Belmont Mining', branch: 'North Region HQ', amount: '42900', status: 'COMPLETED' },
    { id: 'SL-24893', date: 'Jan23', customer: 'Pinnacle Ventures', branch: 'Central Corporate', amount: '1450.25', status: 'FLAGGED' },
    { id: 'SL-24894', date: 'Jan22', customer: 'Nexus Tech', branch: 'North Region HQ', amount: '8120', status: 'COMPLETED' }
];

const statusOptions = ['All', 'Completed', 'Pending', 'Flagged'];

const statusClassMap = {
    COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    PENDING: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    FLAGGED: 'bg-red-50 text-red-700 ring-red-200'
};

const FilterButton = ({ icon: Icon, label, onClick }) => (
    <button onClick={onClick} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
        <Icon className="mr-2 h-4 w-4 text-slate-400" />
        {label}
    </button>
);

export const SalesPage = () => {
    const [statusFilter, setStatusFilter] = React.useState('All');
    const [openMenuId, setOpenMenuId] = React.useState(null);

    const filteredSales = statusFilter === 'All'
        ? salesData
        : salesData.filter((row) => row.status === statusFilter.toUpperCase());

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
                        <p className="mt-1 text-sm text-slate-500">Static branch revenue and order audit overview.</p>
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
                                    {filteredSales.map((row) => (
                                        <tr key={row.id} className="text-sm text-slate-700">
                                            <td className="px-4 py-4 font-semibold text-slate-900">{row.id}</td>
                                            <td className="px-4 py-4">{row.date}</td>
                                            <td className="px-4 py-4">{row.customer}</td>
                                            <td className="px-4 py-4">{row.branch}</td>
                                            <td className="px-4 py-4 font-medium">{row.amount}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassMap[row.status]}`}>
                                                    {row.status}
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
                            <span>Showing 1 to {filteredSales.length} of 8492</span>
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
                                <p className="text-sm text-slate-500">Compliance Score</p>
                                <p className="mt-2 text-3xl font-bold text-emerald-600">98%</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-500">Auto-sync</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">Active</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
