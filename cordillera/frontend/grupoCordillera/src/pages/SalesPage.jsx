import React from 'react';
import { Plus, CalendarDays, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { useSales } from '../hooks/useSales.js';
import { formatCompactNumber, formatCurrency, formatDate, titleCase } from '../utils/formatters.js';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActionMenu } from '../components/ui/ActionMenu';
import { DataTable } from '../components/ui/DataTable';

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

    const toggleMenu = (id) => setOpenMenuId((current) => (current === id ? null : id));

    const handleMenuAction = (action, row) => {
        alert(`${action}: ${row.id} - Cliente ${row.customerId}`);
        setOpenMenuId(null);
    };

    const columns = [
        {
            header: 'ID',
            render: (row) => <span className="font-semibold text-slate-900">SL-{row.id}</span>
        },
        {
            header: 'Date',
            render: (row) => formatDate(row.date)
        },
        {
            header: 'Customer',
            render: (row) => `Cliente #${row.customerId ?? 'N/D'}`
        },
        {
            header: 'Branch',
            render: (row) => `Sucursal #${row.branchId ?? 'N/D'}`
        },
        {
            header: 'Amount',
            render: (row) => <span className="font-medium">{formatCurrency(row.amount)}</span>
        },
        {
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />
        },
        {
            header: 'Actions',
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

    const newSaleButton = (
        <button
            onClick={() => alert('Funcionalidad de nueva venta en desarrollo')}
            className="inline-flex items-center rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
            <Plus className="mr-2 h-4 w-4" />
            New Sale
        </button>
    );

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">

                <PageHeader
                    title="Sales Records"
                    subtitle="Ventas reales consumidas desde el microservicio de ventas."
                    actionButton={newSaleButton}
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <KpiCard key={card.title} {...card} />
                    ))}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <FilterButton icon={CalendarDays} label="Date Range" onClick={() => alert('Filtro estático')} />
                        <FilterButton icon={Building2} label="Branch" onClick={() => alert('Filtro estático')} />
                        <Dropdown label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
                    <div className="space-y-0">
                        {error && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <DataTable
                            columns={columns}
                            data={filteredSales}
                            loading={loading}
                            emptyMessage="No hay ventas registradas."
                        />

                        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 shadow-sm">
                            <span>Mostrando {filteredSales.length} de {sales.length} ventas</span>
                            <div className="flex items-center gap-2">
                                <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
                                <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
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