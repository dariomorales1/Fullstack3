import React from 'react';
import { Download, Plus, AlertTriangle, Eye } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { useInventory } from '../hooks/useInventory.js';
import { formatCompactNumber, formatCurrency, formatDateTime, titleCase } from '../utils/formatters.js';

const statusClassMap = {
    'IN STOCK': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    CRITICAL: 'bg-red-50 text-red-700 ring-red-200',
    'LOW STOCK': 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    'OUT OF STOCK': 'bg-slate-100 text-slate-600 ring-slate-200'
};

export const InventoryPage = () => {
    const { products, loading, error } = useInventory();
    const [activeTab, setActiveTab] = React.useState('Todos');
    const [statusFilter, setStatusFilter] = React.useState('All');

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

        if (!matchesStatus) {
            return false;
        }

        if (activeTab === 'Todos') {
            return true;
        }

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

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Inventory Management</h1>
                        <p className="mt-1 text-sm text-slate-500">Inventario real consumido desde el microservicio de inventario.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </button>
                        <button
                            onClick={() => alert('Funcionalidad de agregar producto en desarrollo')}
                            className="inline-flex items-center rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                                    {Icon ? <Icon className="h-5 w-5 text-red-500" /> : null}
                                </div>
                                <p className="mt-3 text-3xl font-bold">{card.value}</p>
                                <p className={`mt-3 text-sm font-semibold ${card.tone}`}>{card.meta}</p>
                            </div>
                        );
                    })}
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
                    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <h2 className="text-lg font-semibold text-slate-900">Product Directory</h2>
                        </div>
                        {error ? (
                            <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                        ) : null}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-4">SKU ID</th>
                                        <th className="px-4 py-4">Product Name</th>
                                        <th className="px-4 py-4">Category</th>
                                        <th className="px-4 py-4">Stock Level</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Last Audit</th>
                                        <th className="px-4 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">Cargando inventario...</td>
                                        </tr>
                                    ) : null}
                                    {!loading && !filteredProducts.length ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">No hay productos para este filtro.</td>
                                        </tr>
                                    ) : null}
                                    {!loading && filteredProducts.map((product) => (
                                        <tr key={product.sku}>
                                            <td className="px-4 py-4 font-semibold text-slate-900">{product.sku}</td>
                                            <td className="px-4 py-4">{product.name}</td>
                                            <td className="px-4 py-4">{titleCase(product.category)}</td>
                                            <td className="px-4 py-4">{formatCompactNumber(product.totalStock)}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassMap[product.status]}`}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">{formatDateTime(product.lastUpdated)}</td>
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => alert(`Ver producto: ${product.sku} - ${product.name}`)}
                                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
        </div>
    );
};
