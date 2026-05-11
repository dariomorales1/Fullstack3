import React from 'react';
import { Plus, Download, Printer, MoreHorizontal, X } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { useFinance } from '../hooks/useFinance.js';
import { financeApi } from '../api/financeApi.js';
import { exportWorkbook } from '../utils/exportExcel.js';
import { formatCompactNumber, formatCurrency, formatDateTime, titleCase } from '../utils/formatters.js';

const typeClassMap = {
    INCOME: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    INGRESO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    EXPENSE: 'bg-red-50 text-red-700 ring-red-200',
    EGRESO: 'bg-red-50 text-red-700 ring-red-200'
};

export const FinancePage = () => {
    const { movements, balances, loading, error, refetch } = useFinance();
    const [openMenuId, setOpenMenuId] = React.useState(null);
    const [periodFilter, setPeriodFilter] = React.useState('Todos los periodos');
    const [typeFilter, setTypeFilter] = React.useState('All Types');
    const [branchFilter, setBranchFilter] = React.useState('All Branches');
    const [showModal, setShowModal] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [formError, setFormError] = React.useState('');
    const [formData, setFormData] = React.useState({
        type: 'INCOME',
        amount: '',
        date: '',
        branchId: '1',
        category: '',
        description: '',
    });

    const periodOptions = ['Todos los periodos', ...new Set(balances.map((balance) => balance.period).filter(Boolean))];
    const typeOptions = ['All Types', ...new Set(movements.map((movement) => titleCase(movement.type)).filter(Boolean))];
    const branchOptions = ['All Branches', ...new Set(movements.map((movement) => `Sucursal ${movement.branchId}`).filter(Boolean))];

    const filteredRows = movements.filter((row) => {
        const matchesType = typeFilter === 'All Types' || titleCase(row.type) === typeFilter;
        const matchesBranch = branchFilter === 'All Branches' || `Sucursal ${row.branchId}` === branchFilter;
        const matchesPeriod = periodFilter === 'Todos los periodos' || balances.some((balance) => balance.period === periodFilter && balance.branchId === row.branchId);
        return matchesType && matchesBranch && matchesPeriod;
    });

    const totalIncome = movements
        .filter((movement) => ['INCOME', 'INGRESO'].includes(movement.type))
        .reduce((acc, movement) => acc + Number(movement.amount ?? 0), 0);
    const totalExpenses = movements
        .filter((movement) => ['EXPENSE', 'EGRESO'].includes(movement.type))
        .reduce((acc, movement) => acc + Number(movement.amount ?? 0), 0);

    const cards = [
        { title: 'Ingresos Totales', value: formatCurrency(totalIncome), meta: 'Movimientos tipo ingreso', tone: 'text-emerald-600' },
        { title: 'Gastos Totales', value: formatCurrency(totalExpenses), meta: 'Movimientos tipo egreso', tone: 'text-rose-600' },
        { title: 'Flujo Neto', value: formatCurrency(totalIncome - totalExpenses), meta: 'Ingreso menos gasto', tone: 'text-slate-500' },
        { title: 'Balances Disponibles', value: formatCompactNumber(balances.length), meta: 'Periodos consolidados', tone: 'text-emerald-600' }
    ];

    const toggleMenu = (id) => {
        setOpenMenuId((current) => (current === id ? null : id));
    };

    const handleMenuAction = (action, row) => {
        alert(`${action}: ${row.id} - Sucursal ${row.branchId}`);
        setOpenMenuId(null);
    };

    const updateFormField = (field, value) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const handleExport = () => {
        exportWorkbook('finanzas-cordillera', [
            {
                name: 'Movimientos',
                columns: ['ID', 'Tipo', 'Monto', 'Fecha', 'Sucursal', 'Categoria', 'Descripcion'],
                rows: filteredRows.map((row) => ({
                    ID: row.id,
                    Tipo: titleCase(row.type),
                    Monto: Number(row.amount ?? 0),
                    Fecha: formatDateTime(row.date),
                    Sucursal: row.branchId,
                    Categoria: titleCase(row.category),
                    Descripcion: row.description,
                })),
            },
            {
                name: 'Balances',
                columns: ['Periodo', 'Sucursal', 'Ingresos', 'Gastos', 'Utilidad'],
                rows: balances.map((row) => ({
                    Periodo: row.period,
                    Sucursal: row.branchId,
                    Ingresos: Number(row.income ?? 0),
                    Gastos: Number(row.expenses ?? 0),
                    Utilidad: Number(row.profit ?? 0),
                })),
            },
        ]);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=1024,height=768');
        if (!printWindow) {
            return;
        }

        const rowsHtml = filteredRows.map((row) => `
            <tr>
                <td>FIN-${row.id}</td>
                <td>${titleCase(row.type)}</td>
                <td>${formatCurrency(row.amount)}</td>
                <td>${formatDateTime(row.date)}</td>
                <td>Sucursal ${row.branchId}</td>
                <td>${titleCase(row.category)}</td>
                <td>${row.description || ''}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Finanzas Cordillera</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
                        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
                        th { background: #f8fafc; }
                    </style>
                </head>
                <body>
                    <h1>Financial Oversight</h1>
                    <p>Movimientos filtrados: ${filteredRows.length}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tipo</th>
                                <th>Monto</th>
                                <th>Fecha</th>
                                <th>Sucursal</th>
                                <th>Categoria</th>
                                <th>Descripcion</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const handleCreateMovement = async () => {
        setSaving(true);
        setFormError('');
        try {
            await financeApi.createMovement({
                type: formData.type,
                amount: Number(formData.amount),
                date: formData.date || null,
                branchId: Number(formData.branchId),
                category: formData.category,
                description: formData.description,
            });
            await refetch();
            setShowModal(false);
            setFormData({
                type: 'INCOME',
                amount: '',
                date: '',
                branchId: '1',
                category: '',
                description: '',
            });
        } catch (createError) {
            setFormError(createError.response?.data?.message || 'No se pudo registrar el movimiento.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Financial Oversight</h1>
                        <p className="mt-1 text-sm text-slate-500">Movimientos y balances reales consumidos desde finanzas.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
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
                        <button onClick={handleExport} className="rounded-xl border border-slate-200 p-3 text-slate-600 shadow-sm transition hover:border-slate-300"><Download className="h-4 w-4" /></button>
                        <button onClick={handlePrint} className="rounded-xl border border-slate-200 p-3 text-slate-600 shadow-sm transition hover:border-slate-300"><Printer className="h-4 w-4" /></button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    {error ? (
                        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                    ) : null}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-4">Movement ID</th>
                                    <th className="px-4 py-4">Type</th>
                                    <th className="px-4 py-4">Amount</th>
                                    <th className="px-4 py-4">Date</th>
                                    <th className="px-4 py-4">Branch</th>
                                    <th className="px-4 py-4">Category</th>
                                    <th className="px-4 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">Cargando movimientos...</td>
                                    </tr>
                                ) : null}
                                {!loading && !filteredRows.length ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">No hay movimientos para este filtro.</td>
                                    </tr>
                                ) : null}
                                {!loading && filteredRows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-4 font-semibold text-slate-900">FIN-{row.id}</td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${typeClassMap[row.type] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                                                {titleCase(row.type)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 font-medium">{formatCurrency(row.amount)}</td>
                                        <td className="px-4 py-4">{formatDateTime(row.date)}</td>
                                        <td className="px-4 py-4">Sucursal {row.branchId}</td>
                                        <td className="px-4 py-4">{titleCase(row.category)}</td>
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
                        Mostrando {filteredRows.length} de {movements.length} movimientos.
                    </div>
                </div>
            </div>

            {showModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Nuevo Movimiento</h2>
                            <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {formError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                                Tipo
                                <select value={formData.type} onChange={(event) => updateFormField('type', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none">
                                    <option value="INCOME">Income</option>
                                    <option value="EXPENSE">Expense</option>
                                </select>
                            </label>
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
                                Categoria
                                <input type="text" value={formData.category} onChange={(event) => updateFormField('category', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                Descripcion
                                <textarea value={formData.description} onChange={(event) => updateFormField('description', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" rows="3" />
                            </label>
                        </div>
                        <button onClick={handleCreateMovement} disabled={saving} className="mt-6 w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                            {saving ? 'Guardando...' : 'Guardar Movimiento'}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
