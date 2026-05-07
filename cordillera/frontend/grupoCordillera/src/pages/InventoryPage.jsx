import React from 'react';
import { Download, Plus, AlertTriangle, Eye } from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';

const cards = [
    { title: 'Total SKUs', value: '12482', meta: '+2.4%', tone: 'text-emerald-600' },
    { title: 'Stock Valuation', value: '4.2M', meta: 'Stable', tone: 'text-slate-500' },
    { title: 'Critical Alerts', value: '14', meta: 'Immediate review', tone: 'text-red-600', icon: AlertTriangle },
    { title: 'Fulfillment Rate', value: '98.2%', meta: 'Operational target', tone: 'text-emerald-600' }
];

const tabs = ['All Products', 'Warehouse A', 'Regional Hubs'];
const statusOptions = ['All', 'IN STOCK', 'LOW STOCK', 'CRITICAL', 'OUT OF STOCK'];

const products = [
    { sku: 'CRD-0042-X', name: 'Enterprise Rack Unit V4', category: 'Core Hardware', stock: '1240', status: 'IN STOCK', audit: '2h ago' },
    { sku: 'CRD-9912-L', name: 'Quantum Processor Module', category: 'Electronics', stock: '12', status: 'CRITICAL', audit: '12h ago' },
    { sku: 'CRD-0881-Z', name: 'Shielded Fiber Optic', category: 'Connectivity', stock: '850', status: 'LOW STOCK', audit: '1d ago' },
    { sku: 'CRD-5501-A', name: 'Solar Array Controller', category: 'Power Systems', stock: '145', status: 'IN STOCK', audit: '4d ago' },
    { sku: 'CRD-1120-K', name: 'Satellite Uplink Kit', category: 'Connectivity', stock: '0', status: 'OUT OF STOCK', audit: 'Just now' }
];

const statusClassMap = {
    'IN STOCK': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    CRITICAL: 'bg-red-50 text-red-700 ring-red-200',
    'LOW STOCK': 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    'OUT OF STOCK': 'bg-slate-100 text-slate-600 ring-slate-200'
};

const utilization = [
    { name: 'London Central', value: 88, color: 'bg-blue-600' },
    { name: 'New York Hub', value: 42, color: 'bg-emerald-500' },
    { name: 'Singapore Terminal', value: 95, color: 'bg-amber-500' }
];

export const InventoryPage = () => {
    const [activeTab, setActiveTab] = React.useState('All Products');
    const [statusFilter, setStatusFilter] = React.useState('All');

    const filteredProducts = products.filter((product) => {
        const matchesStatus = statusFilter === 'All' || product.status === statusFilter;

        if (!matchesStatus) {
            return false;
        }

        if (activeTab === 'All Products') {
            return true;
        }

        if (activeTab === 'Warehouse A') {
            return ['IN STOCK', 'CRITICAL'].includes(product.status);
        }

        return product.category === 'Connectivity';
    });

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Inventory Management</h1>
                        <p className="mt-1 text-sm text-slate-500">Static product directory and warehouse utilization view.</p>
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
                                    {filteredProducts.map((product) => (
                                        <tr key={product.sku}>
                                            <td className="px-4 py-4 font-semibold text-slate-900">{product.sku}</td>
                                            <td className="px-4 py-4">{product.name}</td>
                                            <td className="px-4 py-4">{product.category}</td>
                                            <td className="px-4 py-4">{product.stock}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassMap[product.status]}`}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">{product.audit}</td>
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
