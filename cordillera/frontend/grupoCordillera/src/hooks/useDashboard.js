import { useEffect, useState } from 'react';
import { customersApi } from '../api/customersApi.js';
import { dashboardApi } from '../api/dashboardApi.js';
import { financeApi } from '../api/financeApi.js';
import { inventoryApi } from '../api/inventoryApi.js';
import { salesApi } from '../api/salesApi.js';

const PERIOD_FILTERS = {
    'Mes Actual': (date, latestDate) =>
        date.getFullYear() === latestDate.getFullYear() && date.getMonth() === latestDate.getMonth(),
    'Mes Anterior': (date, latestDate) => {
        const previous = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
        return date.getFullYear() === previous.getFullYear() && date.getMonth() === previous.getMonth();
    },
    'Ultimo Trimestre': (date, latestDate) => {
        const start = new Date(latestDate.getFullYear(), latestDate.getMonth() - 2, 1);
        return date >= start && date <= latestDate;
    },
    'Ano Actual': (date, latestDate) => date.getFullYear() === latestDate.getFullYear(),
};

const getSafeDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const sumBy = (items, selector) => items.reduce((total, item) => total + selector(item), 0);

const getLatestDate = (sales) => {
    const dates = sales
        .map((sale) => getSafeDate(sale.date))
        .filter(Boolean)
        .sort((left, right) => right - left);

    return dates[0] || new Date();
};

const filterSalesByPeriod = (sales, period) => {
    const latestDate = getLatestDate(sales);
    const predicate = PERIOD_FILTERS[period] || PERIOD_FILTERS['Mes Actual'];
    return sales.filter((sale) => {
        const saleDate = getSafeDate(sale.date);
        return saleDate ? predicate(saleDate, latestDate) : false;
    });
};

const buildBranchSales = (sales) => {
    const branchNames = {
        1: 'STGO',
        2: 'VALP',
        3: 'CONC',
        4: 'ANTO',
    };

    const totals = sales.reduce((accumulator, sale) => {
        const branchId = sale.branchId ?? 0;
        accumulator[branchId] = (accumulator[branchId] || 0) + Number(sale.amount ?? 0);
        return accumulator;
    }, {});

    return Object.entries(branchNames).map(([branchId, name]) => ({
        name,
        ventas: totals[branchId] || 0,
    }));
};

const buildRevenueTrend = (sales) => {
    const monthFormatter = new Intl.DateTimeFormat('es-CL', { month: 'short' });
    const totals = new Map();

    sales.forEach((sale) => {
        const saleDate = getSafeDate(sale.date);
        if (!saleDate) {
            return;
        }

        const key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        const current = totals.get(key) || { date: new Date(saleDate.getFullYear(), saleDate.getMonth(), 1), ventas: 0 };
        current.ventas += Number(sale.amount ?? 0);
        totals.set(key, current);
    });

    return [...totals.entries()]
        .sort((left, right) => left[0].localeCompare(right[0]))
        .slice(-6)
        .map(([, value]) => ({
            name: monthFormatter.format(value.date).replace('.', '').toUpperCase(),
            ventas: value.ventas,
        }));
};

const buildAlerts = (inventoryProducts, dashboardData) => {
    const stockAlerts = inventoryProducts.flatMap((product) =>
        (product.stocks || [])
            .filter((stock) => Number(stock.quantity ?? 0) <= Number(stock.minimumStock ?? 0))
            .map((stock) => ({
                title: `Stock critico ${product.name} en sucursal #${stock.branchId}`,
                time: 'Inventario',
                category: 'Inventario',
            }))
    );

    const kpiAlerts = (dashboardData?.kpis || [])
        .filter((kpi) => ['EN_RIESGO', 'CRITICO'].includes(kpi.estado))
        .map((kpi) => ({
            title: `${kpi.codigo} en estado ${String(kpi.estado).replace('_', ' ').toLowerCase()}`,
            time: 'KPI',
            category: 'Kpis',
        }));

    return [...stockAlerts, ...kpiAlerts].slice(0, 6);
};

const filterAlertsByCategory = (alerts, category) => {
    if (category === 'Todas las Categorias') {
        return alerts;
    }

    const map = {
        Ventas: 'Ventas',
        Inventario: 'Inventario',
        Finanzas: 'Finanzas',
        Clientes: 'Clientes',
    };

    return alerts.filter((alert) => alert.category === map[category]);
};

export const useDashboard = (period = 'Mes Actual', category = 'Todas las Categorias') => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboard = async () => {
        setLoading(true);
        setError('');

        try {
            const [dashboardData, sales, inventory, movements, balances, customers] = await Promise.all([
                dashboardApi.getDashboard(),
                salesApi.getAll(),
                inventoryApi.getAll(),
                financeApi.getMovements(),
                financeApi.getBalances(),
                customersApi.getAll(),
            ]);

            const safeSales = Array.isArray(sales) ? sales : [];
            const safeInventory = Array.isArray(inventory) ? inventory : [];
            const safeMovements = Array.isArray(movements) ? movements : [];
            const safeBalances = Array.isArray(balances) ? balances : [];
            const safeCustomers = Array.isArray(customers) ? customers : [];
            const filteredSales = filterSalesByPeriod(safeSales, period);

            const ventasTotales = sumBy(filteredSales, (sale) => Number(sale.amount ?? 0));
            const inventarioValorizado = sumBy(safeInventory, (product) =>
                sumBy(product.stocks || [], (stock) => Number(stock.quantity ?? 0) * Number(product.price ?? 0))
            );
            const profitTotal = sumBy(safeBalances, (balance) => Number(balance.profit ?? 0));
            const incomeTotal = sumBy(safeBalances, (balance) => Number(balance.income ?? 0));
            const margenFinanciero = incomeTotal > 0 ? (profitTotal / incomeTotal) * 100 : 0;
            const activosRecientes = safeCustomers.filter((customer) => {
                const registrationDate = getSafeDate(customer.registrationDate);
                const latestDate = getLatestDate(safeSales);
                return registrationDate ? registrationDate.getFullYear() === latestDate.getFullYear() : false;
            }).length;

            const alerts = filterAlertsByCategory(buildAlerts(safeInventory, dashboardData), category);

            setData({
                dashboard: dashboardData,
                metrics: [
                    { title: 'Ventas Totales', value: ventasTotales, delta: `${filteredSales.length} operaciones`, direction: 'up', format: 'currency' },
                    { title: 'Inventario Valorizado', value: inventarioValorizado, delta: `${safeInventory.length} productos`, direction: 'neutral', format: 'currency' },
                    { title: 'Margen Financiero', value: margenFinanciero, delta: `${safeMovements.length} movimientos`, direction: margenFinanciero >= 0 ? 'up' : 'down', format: 'percentage' },
                    { title: 'Clientes Activos', value: safeCustomers.length, delta: `${activosRecientes} alta(s) este ano`, direction: 'up', format: 'number' },
                ],
                branchSales: buildBranchSales(filteredSales),
                revenueTrend: buildRevenueTrend(safeSales),
                alerts,
                executiveSummary: {
                    title: dashboardData?.degraded
                        ? 'El dashboard opera con degradacion parcial de servicios.'
                        : 'El holding mantiene visibilidad operativa sobre ventas, KPIs e inventario.',
                    description: `KPIs cumplidos: ${dashboardData?.summary?.kpisCumplidos ?? 0}, en riesgo: ${dashboardData?.summary?.kpisEnRiesgo ?? 0}, criticos: ${dashboardData?.summary?.kpisCriticos ?? 0}. Reportes disponibles: ${dashboardData?.summary?.totalReportes ?? 0}.`,
                },
                generatedAt: dashboardData?.generatedAt || null,
            });
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || 'No se pudo cargar el dashboard principal.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [period, category]);

    return {
        data,
        loading,
        error,
        refetch: fetchDashboard,
    };
};
