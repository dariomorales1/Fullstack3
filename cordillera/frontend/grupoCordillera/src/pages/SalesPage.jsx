import React from 'react';
import { Plus, ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { useSales } from '../hooks/useSales.js';
import { salesApi } from '../api/salesApi.js';
import { formatCompactNumber, formatCurrency, formatDate, titleCase } from '../utils/formatters.js';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActionMenu } from '../components/ui/ActionMenu';
import { DataTable } from '../components/ui/DataTable';

const getDateRangeLabel = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'All Dates';
    }

    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
        return 'Ultimos 30 dias';
    }
    if (diffDays <= 90) {
        return 'Ultimo trimestre';
    }
    if (date.getFullYear() === now.getFullYear()) {
        return 'Ano actual';
    }

    return 'Historico';
};

export const SalesPage = () => {
    const { sales, loading, error, refetch } = useSales();
    const [statusFilter, setStatusFilter] = React.useState('All');
    const [branchFilter, setBranchFilter] = React.useState('All Branches');
    const [dateRangeFilter, setDateRangeFilter] = React.useState('All Dates');
    const [openMenuId, setOpenMenuId] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [formError, setFormError] = React.useState('');
    const [formData, setFormData] = React.useState({
        amount: '',
        date: '',
        branchId: '1',
        customerId: '',
        paymentMethod: 'TRANSFERENCIA',
        status: 'COMPLETADA',
    });

    const statusOptions = ['All', ...new Set(sales.map((row) => titleCase(row.status)).filter(Boolean))];
    const branchOptions = ['All Branches', ...new Set(sales.map((row) => `Sucursal ${row.branchId}`).filter(Boolean))];
    const dateOptions = ['All Dates', 'Ultimos 30 dias', 'Ultimo trimestre', 'Ano actual', 'Historico'];

    const summaryCards = [
        { title: 'Ingresos Totales', value: formatCurrency(sales.reduce((acc, row) => acc + Number(row.amount ?? 0), 0)), meta: 'Ventas registradas', tone: 'text-emerald-600' },
        { title: 'Total Ordenes', value: formatCompactNumber(sales.length), meta: 'Operaciones cargadas', tone: 'text-slate-500' },
        { title: 'Sucursales Activas', value: String(new Set(sales.map((row) => row.branchId).filter(Boolean)).size), meta: 'Con ventas emitidas', tone: 'text-slate-500' },
        { title: 'Ticket Promedio', value: formatCurrency(sales.length ? sales.reduce((acc, row) => acc + Number(row.amount ?? 0), 0) / sales.length : 0), meta: 'Promedio por venta', tone: 'text-emerald-600' }
    ];

    const filteredSales = sales.filter((row) => {
        const matchesStatus = statusFilter === 'All' || titleCase(row.status) === statusFilter;
        const matchesBranch = branchFilter === 'All Branches' || `Sucursal ${row.branchId}` === branchFilter;
        const matchesDate = dateRangeFilter === 'All Dates' || getDateRangeLabel(row.date) === dateRangeFilter;
        return matchesStatus && matchesBranch && matchesDate;
    });

    const toggleMenu = (id) => setOpenMenuId((current) => (current === id ? null : id));

    const handleMenuAction = (action, row) => {
        alert(`${action}: ${row.id} - Cliente #${row.customerId ?? 'N/D'}`);
        setOpenMenuId(null);
    };

    const updateFormField = (field, value) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const handleCreateSale = async () => {
        setSaving(true);
        setFormError('');

        try {
            await salesApi.create({
                amount: Number(formData.amount),
                date: formData.date || null,
                branchId: Number(formData.branchId),
                customerId: Number(formData.customerId),
                paymentMethod: formData.paymentMethod,
                status: formData.status,
                details: [],
            });
            await refetch();
            setShowModal(false);
            setFormData({
                amount: '',
                date: '',
                branchId: '1',
                customerId: '',
                paymentMethod: 'TRANSFERENCIA',
                status: 'COMPLETADA',
            });
        } catch (createError) {
            setFormError(createError.response?.data?.message || 'No se pudo registrar la venta.');
        } finally {
            setSaving(false);
        }
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
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center self-start rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Sale
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <KpiCard key={card.title} {...card} />
                    ))}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Dropdown label="Date Range" value={dateRangeFilter} options={dateOptions} onChange={setDateRangeFilter} />
                        <Dropdown label="Branch" value={branchFilter} options={branchOptions} onChange={setBranchFilter} />
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

            {showModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Nueva Venta</h2>
                            <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {formError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                                Monto
                                <input type="number" min="1" value={formData.amount} onChange={(event) => updateFormField('amount', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                                Fecha
                                <input type="datetime-local" value={formData.date} onChange={(event) => updateFormField('date', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                                Sucursal
                                <input type="number" min="1" value={formData.branchId} onChange={(event) => updateFormField('branchId', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                                Cliente
                                <input type="number" min="1" value={formData.customerId} onChange={(event) => updateFormField('customerId', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                                Metodo de Pago
                                <select value={formData.paymentMethod} onChange={(event) => updateFormField('paymentMethod', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none">
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="TARJETA">Tarjeta</option>
                                    <option value="EFECTIVO">Efectivo</option>
                                </select>
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                                Estado
                                <select value={formData.status} onChange={(event) => updateFormField('status', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none">
                                    <option value="COMPLETADA">Completada</option>
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="ANULADA">Anulada</option>
                                </select>
                            </label>
                        </div>
                        <button onClick={handleCreateSale} disabled={saving} className="mt-6 w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                            {saving ? 'Guardando...' : 'Guardar Venta'}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};