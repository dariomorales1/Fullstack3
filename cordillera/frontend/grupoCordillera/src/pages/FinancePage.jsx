import React from 'react';
import { Plus, Download, Printer } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { useFinance } from '../hooks/useFinance.js';
import { formatCompactNumber, formatCurrency, formatDateTime, titleCase } from '../utils/formatters.js';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActionMenu } from '../components/ui/ActionMenu';
import { DataTable } from '../components/ui/DataTable';

export const FinancePage = () => {
    const { movements = [], balances = [], loading, error } = useFinance();

    const [openMenuId, setOpenMenuId] = React.useState(null);
    const [periodFilter, setPeriodFilter] = React.useState('Todos los periodos');
    const [typeFilter, setTypeFilter] = React.useState('All Types');
    const [branchFilter, setBranchFilter] = React.useState('All Branches');

    const periodOptions = ['Todos los periodos', ...new Set(balances.map((b) => b.period).filter(Boolean))];
    const typeOptions = ['All Types', ...new Set(movements.map((m) => titleCase(m.type)).filter(Boolean))];
    const branchOptions = ['All Branches', ...new Set(movements.map((m) => `Sucursal ${m.branchId}`).filter(Boolean))];

    const filteredRows = movements.filter((row) => {
        const matchesType = typeFilter === 'All Types' || titleCase(row.type) === typeFilter;
        const matchesBranch = branchFilter === 'All Branches' || `Sucursal ${row.branchId}` === branchFilter;
        const matchesPeriod = periodFilter === 'Todos los periodos' || balances.some((balance) => balance.period === periodFilter && balance.branchId === row.branchId);
        return matchesType && matchesBranch && matchesPeriod;
    });

    const totalIncome = movements.filter((m) => m.type === 'INCOME').reduce((acc, m) => acc + Number(m.amount ?? 0), 0);
    const totalExpenses = movements.filter((m) => m.type === 'EXPENSE').reduce((acc, m) => acc + Number(m.amount ?? 0), 0);

    const cards = [
        { title: 'Ingresos Totales', value: formatCurrency(totalIncome), meta: 'Movimientos tipo ingreso', tone: 'text-emerald-600' },
        { title: 'Gastos Totales', value: formatCurrency(totalExpenses), meta: 'Movimientos tipo egreso', tone: 'text-rose-600' },
        { title: 'Flujo Neto', value: formatCurrency(totalIncome - totalExpenses), meta: 'Ingreso menos gasto', tone: 'text-slate-500' },
        { title: 'Balances Disponibles', value: formatCompactNumber(balances.length), meta: 'Periodos consolidados', tone: 'text-emerald-600' }
    ];

    const toggleMenu = (id) => setOpenMenuId((current) => (current === id ? null : id));

    const handleMenuAction = (action, row) => {
        alert(`${action}: ${row.id} - Sucursal ${row.branchId}`);
        setOpenMenuId(null);
    };

    const columns = [
        {
            header: 'ID',
            render: (row) => <span className="font-semibold text-slate-900">FIN-{row.id}</span>
        },
        {
            header: 'Tipo',
            render: (row) => <StatusBadge status={row.type} />
        },
        {
            header: 'Monto',
            render: (row) => <span className="font-medium">{formatCurrency(row.amount)}</span>
        },
        {
            header: 'Fecha',
            render: (row) => formatDateTime(row.date)
        },
        {
            header: 'Sucursal',
            render: (row) => `Sucursal ${row.branchId}`
        },
        {
            header: 'Categoría',
            render: (row) => titleCase(row.category)
        },
        {
            header: 'Acciones',
            render: (row) => (
                <ActionMenu
                    isOpen={openMenuId === row.id}
                    onToggle={() => toggleMenu(row.id)}
                    actions={[
                        { label: 'Ver Detalle', onClick: () => handleMenuAction('Ver Detalle', row) },
                        { label: 'Editar', onClick: () => handleMenuAction('Editar', row) },
                        { label: 'Eliminar', danger: true, onClick: () => handleMenuAction('Eliminar', row) }
                    ]}
                />
            )
        }
    ];

    const newMovementBtn = (
        <button className="inline-flex items-center rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition">
            <Plus className="mr-2 h-4 w-4" />
            New Movement
        </button>
    );

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">

                <PageHeader
                    title="Financial Oversight"
                    subtitle="Movimientos y balances reales consumidos desde finanzas."
                    actionButton={newMovementBtn}
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <KpiCard key={card.title} {...card} />
                    ))}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Dropdown label="Periodo" value={periodFilter} options={periodOptions} onChange={setPeriodFilter} />
                        <Dropdown label="Tipo" value={typeFilter} options={typeOptions} onChange={setTypeFilter} />
                        <Dropdown label="Sucursal" value={branchFilter} options={branchOptions} onChange={setBranchFilter} />
                    </div>
                    <div className="flex gap-3">
                        <button className="rounded-xl border border-slate-200 p-3 text-slate-600 shadow-sm hover:bg-slate-50">
                            <Download className="h-4 w-4" />
                        </button>
                        <button className="rounded-xl border border-slate-200 p-3 text-slate-600 shadow-sm hover:bg-slate-50">
                            <Printer className="h-4 w-4" />
                        </button>
                    </div>
                </div>

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
                        emptyMessage="No hay movimientos registrados para este filtro."
                    />
                </div>
            </div>
        </div>
    );
};