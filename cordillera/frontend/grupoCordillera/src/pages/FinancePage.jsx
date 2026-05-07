import React from 'react';
import { Plus, Download, Printer, MoreHorizontal } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';

const cards = [
    { title: 'Total Income MTD', value: '4.28M', meta: '+12.5%', tone: 'text-emerald-600' },
    { title: 'Total Expenses MTD', value: '1.92M', meta: '+4.2%', tone: 'text-rose-600' },
    { title: 'Net Cashflow', value: '2.36M', meta: 'Stable', tone: 'text-slate-500' },
    { title: 'Branch Efficiency', value: '94.2%', meta: 'Target 92%', tone: 'text-emerald-600' }
];

const rows = [
    { id: 'FIN-82910', type: 'Income', amount: '45200', date: 'Oct24', branch: 'Cordillera North-West', status: 'Verified' },
    { id: 'FIN-82911', type: 'Expense', amount: '12840.50', date: 'Oct23', branch: 'Logistics Central Hub', status: 'Pending' },
    { id: 'FIN-82912', type: 'Income', amount: '112000', date: 'Oct23', branch: 'Main Office Corporate', status: 'Verified' },
    { id: 'FIN-82913', type: 'Expense', amount: '3400', date: 'Oct22', branch: 'Cordillera South-East', status: 'Verified' },
    { id: 'FIN-82914', type: 'Income', amount: '8900', date: 'Oct22', branch: 'Cordillera South-East', status: 'Verified' }
];

const periodOptions = ['Last 30 Days', 'Last 90 Days', 'This Year'];
const typeOptions = ['All Types', 'Income', 'Expense'];
const branchOptions = ['All Branches', 'Cordillera North-West', 'Logistics Central Hub', 'Main Office Corporate', 'Cordillera South-East'];

const typeClassMap = {
    Income: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Expense: 'bg-red-50 text-red-700 ring-red-200'
};

export const FinancePage = () => {
    const [openMenuId, setOpenMenuId] = React.useState(null);
    const [periodFilter, setPeriodFilter] = React.useState('Last 30 Days');
    const [typeFilter, setTypeFilter] = React.useState('All Types');
    const [branchFilter, setBranchFilter] = React.useState('All Branches');

    const filteredRows = rows.filter((row) => {
        const matchesType = typeFilter === 'All Types' || row.type === typeFilter;
        const matchesBranch = branchFilter === 'All Branches' || row.branch === branchFilter;
        return matchesType && matchesBranch;
    });

    const toggleMenu = (id) => {
        setOpenMenuId((current) => (current === id ? null : id));
    };

    const handleMenuAction = (action, row) => {
        alert(`${action}: ${row.id} - ${row.branch}`);
        setOpenMenuId(null);
    };

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Financial Oversight</h1>
                        <p className="mt-1 text-sm text-slate-500">Static month-to-date movement monitoring for branches.</p>
                    </div>
                    <button
                        onClick={() => alert('Funcionalidad de nuevo movimiento en desarrollo')}
                        className="inline-flex items-center self-start rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Movement
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
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Dropdown value={periodFilter} options={periodOptions} onChange={setPeriodFilter} />
                        <Dropdown value={typeFilter} options={typeOptions} onChange={setTypeFilter} />
                        <Dropdown value={branchFilter} options={branchOptions} onChange={setBranchFilter} />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => alert('Descargar movimientos')} className="rounded-xl border border-slate-200 p-3 text-slate-600 shadow-sm"><Download className="h-4 w-4" /></button>
                        <button onClick={() => alert('Imprimir movimientos')} className="rounded-xl border border-slate-200 p-3 text-slate-600 shadow-sm"><Printer className="h-4 w-4" /></button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-4">Movement ID</th>
                                    <th className="px-4 py-4">Type</th>
                                    <th className="px-4 py-4">Amount</th>
                                    <th className="px-4 py-4">Date</th>
                                    <th className="px-4 py-4">Branch</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-4 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                                {filteredRows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-4 font-semibold text-slate-900">{row.id}</td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${typeClassMap[row.type]}`}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 font-medium">{row.amount}</td>
                                        <td className="px-4 py-4">{row.date}</td>
                                        <td className="px-4 py-4">{row.branch}</td>
                                        <td className="px-4 py-4">{row.status}</td>
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
                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                        Showing 1 to {filteredRows.length} of 128 results.
                    </div>
                </div>
            </div>
        </div>
    );
};
