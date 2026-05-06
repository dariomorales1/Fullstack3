import DashboardPage from '../pages/DashboardPage';
import SalesPage from '../pages/SalesPage';
import InventoryPage from '../pages/InventoryPage';
import FinancePage from '../pages/FinancePage';
import CustomersPage from '../pages/CustomersPage';
import ReportsPage from '../pages/ReportsPage';
import LoginPage from '../pages/auth/LoginPage';

// Rutas Públicas
export const PUBLIC_ROUTES = [
    {
        path: '/login',
        element: LoginPage,
        name: 'Login'
    }
];

// Rutas Privadas (Protegidas por JWT)
export const PRIVATE_ROUTES = [
    {
        path: '/',
        element: DashboardPage,
        name: 'Dashboard Ejecutivo',
        icon: 'DashboardIcon'
    },
    {
        path: '/sales',
        element: SalesPage,
        name: 'Ventas',
        icon: 'SalesIcon'
    },
    {
        path: '/inventory',
        element: InventoryPage,
        name: 'Inventario',
        icon: 'InventoryIcon'
    },
    {
        path: '/finance',
        element: FinancePage,
        name: 'Finanzas',
        icon: 'FinanceIcon'
    },
    {
        path: '/customers',
        element: CustomersPage,
        name: 'Clientes',
        icon: 'UsersIcon'
    },
    {
        path: '/reports',
        element: ReportsPage,
        name: 'Reportes',
        icon: 'ReportsIcon'
    }
];

export const allRoutes = [...PUBLIC_ROUTES, ...PRIVATE_ROUTES];