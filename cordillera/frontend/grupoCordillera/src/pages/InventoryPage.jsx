import React from 'react';
import { Download, Plus, AlertTriangle, Eye, X } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { useInventory } from '../hooks/useInventory.js';
import { inventoryApi } from '../api/inventoryApi.js';
import { exportWorkbook } from '../utils/exportExcel.js';
import { formatCompactNumber, formatCurrency, formatDateTime, titleCase } from '../utils/formatters.js';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';

export const InventoryPage = () => {
    const { products, loading, error, refetch } = useInventory();
    const [activeTab, setActiveTab] = React.useState('Todos');
    const [statusFilter, setStatusFilter] = React.useState('All');
    const [showModal, setShowModal] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [formError, setFormError] = React.useState('');
    const [formData, setFormData] = React.useState({
        sku: '',
        name: '',
        category: '',
        price: '',
        active: true,
        branchId: '1',
        quantity: '',
        minimumStock: '',
    });

    const normalizedProducts = products.map((product) => {
        const stocks = Array.isArray(product.stocks) ? product.stocks : [];
        const totalStock = stocks.reduce((acc, stock) => acc + Number(stock.quantity ?? 0), 0);
        const minimumStock = stocks.reduce((acc, stock) => acc + Number(stock.minimumStock ?? 0), 0);
        const lastUpdated = stocks
            .map((stock) => stock.lastUpdated)
            .filter(Boolean)
            .sort()
            .at(-1);

        let status = 'IN STOCK';
        if (totalStock <= 0) {
            status = 'OUT OF STOCK';
        } else if (minimumStock > 0 && totalStock <= minimumStock) {
            status = 'CRITICAL';
        } else if (minimumStock > 0 && totalStock <= minimumStock * 2) {
            status = 'LOW STOCK';
        }

        return {
            ...product,
            totalStock,
            minimumStock,
            status,
            lastUpdated,
        };
    });

    const tabs = ['Todos', ...new Set(normalizedProducts.map((product) => titleCase(product.category)).filter(Boolean))];
    const statusOptions = ['All', ...new Set(normalizedProducts.map((product) => product.status))];

    const filteredProducts = normalizedProducts.filter((product) => {
        const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
        if (!matchesStatus) return false;
        if (activeTab === 'Todos') return true;
        return titleCase(product.category) === activeTab;
    });

    const cards = [
        { title: 'Total SKUs', value: formatCompactNumber(normalizedProducts.length), meta: 'Catalogo disponible', tone: 'text-slate-500' },
        { title: 'Valorizacion', value: formatCurrency(normalizedProducts.reduce((acc, product) => acc + (Number(product.price ?? 0) * product.totalStock), 0)), meta: 'Precio x stock', tone: 'text-emerald-600' },
        { title: 'Alertas Criticas', value: String(normalizedProducts.filter((product) => ['CRITICAL', 'OUT OF STOCK'].includes(product.status)).length), meta: 'Requieren revision', tone: 'text-red-600', icon: AlertTriangle },
        { title: 'Productos Activos', value: String(normalizedProducts.filter((product) => product.active).length), meta: 'Marcados como vigentes', tone: 'text-emerald-600' }
    ];

    const branchTotals = {};
    normalizedProducts.forEach((product) => {
        (product.stocks || []).forEach((stock) => {
            const key = `Sucursal ${stock.branchId}`;
            branchTotals[key] = (branchTotals[key] || 0) + Number(stock.quantity ?? 0);
        });
    });

    const maxBranchStock = Math.max(...Object.values(branchTotals), 0);
    const utilization = Object.entries(branchTotals)
        .slice(0, 4)
        .map(([name, value], index) => ({
            name,
            value: maxBranchStock ? Math.round((value / maxBranchStock) * 100) : 0,
            color: ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-fuchsia-500'][index] || 'bg-slate-500'
        }));

    const handleExport = () => {
        exportWorkbook('inventario-cordillera', [
            {
                name: 'Productos',
                columns: ['SKU', 'Nombre', 'Categoria', 'Precio', 'Stock Total', 'Stock Minimo', 'Estado', 'Activo', 'Ultima Actualizacion'],
                rows: filteredProducts.map((product) => ({
                    SKU: product.sku,
                    Nombre: product.name,
                    Categoria: titleCase(product.category),
                    Precio: Number(product.price ?? 0),
                    'Stock Total': Number(product.totalStock ?? 0),
                    'Stock Minimo': Number(product.minimumStock ?? 0),
                    Estado: product.status,
                    Activo: product.active ? 'Si' : 'No',
                    'Ultima Actualizacion': formatDateTime(product.lastUpdated),
                })),
            },
            {
                name: 'Stocks por Sucursal',
                columns: ['SKU', 'Producto', 'Sucursal', 'Cantidad', 'Stock Minimo', 'Ultima Actualizacion'],
                rows: filteredProducts.flatMap((product) =>
                    (product.stocks || []).map((stock) => ({
                        SKU: product.sku,
                        Producto: product.name,
                        Sucursal: stock.branchId,
                        Cantidad: Number(stock.quantity ?? 0),
                        'Stock Minimo': Number(stock.minimumStock ?? 0),
                        'Ultima Actualizacion': formatDateTime(stock.lastUpdated),
                    }))
                ),
            },
        ]);
    };

    const columns = [
        { header: 'SKU', accessor: 'sku' },
        { header: 'Nombre', accessor: 'name' },
        { header: 'Categoria', render: (row) => titleCase(row.category) },
        { header: 'Precio', render: (row) => formatCurrency(row.price) },
        { header: 'Stock Total', render: (row) => formatCompactNumber(row.totalStock) },
        { header: 'Stock Minimo', render: (row) => formatCompactNumber(row.minimumStock) },
        { header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Activo', render: (row) => (row.active ? 'Si' : 'No') },
        { header: 'Actualizado', render: (row) => formatDateTime(row.lastUpdated) },
    ];

    const updateFormField = (field, value) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const handleCreateProduct = async () => {
        setSaving(true);
        setFormError('');
        try {
            await inventoryApi.create({
                sku: formData.sku,
                name: formData.name,
                category: formData.category,
                price: Number(formData.price),
                active: formData.active,
                stocks: [
                    {
                        branchId: Number(formData.branchId),
                        quantity: Number(formData.quantity),
                        minimumStock: Number(formData.minimumStock),
                    },
                ],
            });
            await refetch();
            setShowModal(false);
            setFormData({
                sku: '',
                name: '',
                category: '',
                price: '',
                active: true,
                branchId: '1',
                quantity: '',
                minimumStock: '',
            });
        } catch (createError) {
            setFormError(createError.response?.data?.message || 'No se pudo crear el producto.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Inventory Management</h1>
                        <p className="mt-1 text-sm text-slate-500">Inventario real consumido desde el microservicio de inventario.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            disabled={!filteredProducts.length}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <KpiCard key={card.title} {...card} />
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                activeTab === tab
                                    ? 'bg-brand-dark text-white ring-2 ring-brand-dark/20'
                                    : 'border border-slate-200 bg-white text-slate-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                    <Dropdown
                        label="Status"
                        value={statusFilter}
                        options={statusOptions}
                        onChange={setStatusFilter}
                        className="sm:ml-auto"
                    />
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
                            data={filteredProducts}
                            loading={loading}
                            emptyMessage="No hay productos para este filtro."
                        />
                    </div>

                    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Warehouse Utilization</h2>
                        <div className="mt-5 space-y-5">
                            {!utilization.length ? (
                                <p className="text-sm text-slate-500">Sin datos de sucursales para mostrar.</p>
                            ) : null}
                            {utilization.map((item) => (
                                <div key={item.name}>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="font-medium text-slate-700">{item.name}</span>
                                        <span className="text-slate-500">{item.value}%</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-slate-200">
                                        <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>

            {showModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Agregar Producto</h2>
                            <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {formError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">SKU
                                <input value={formData.sku} onChange={(event) => updateFormField('sku', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Nombre
                                <input value={formData.name} onChange={(event) => updateFormField('name', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Categoria
                                <input value={formData.category} onChange={(event) => updateFormField('category', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Precio
                                <input type="number" min="1" value={formData.price} onChange={(event) => updateFormField('price', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Sucursal inicial
                                <input type="number" min="1" value={formData.branchId} onChange={(event) => updateFormField('branchId', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Cantidad inicial
                                <input type="number" min="0" value={formData.quantity} onChange={(event) => updateFormField('quantity', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Stock minimo
                                <input type="number" min="0" value={formData.minimumStock} onChange={(event) => updateFormField('minimumStock', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none" />
                            </label>
                            <label className="flex items-center gap-3 text-sm font-medium text-slate-700 sm:col-span-2">
                                <input type="checkbox" checked={formData.active} onChange={(event) => updateFormField('active', event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                                Producto activo
                            </label>
                        </div>
                        <button onClick={handleCreateProduct} disabled={saving} className="mt-6 w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                            {saving ? 'Guardando...' : 'Guardar Producto'}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};