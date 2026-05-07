// Rutas Públicas
import { LoginPage } from '../pages/auth/LoginPage.jsx';
// import { RegisterPage } from '../pages/auth/RegisterPage';

// Rutas Privadas
import { DashboardPage } from '../pages/DashboardPage';
// import { SalesPage } from '../pages/SalesPage';
// import { InventoryPage } from '../pages/InventoryPage';
// import { FinancePage } from '../pages/FinancePage';
// import { CustomersPage } from '../pages/CustomersPage';
// import { ReportsPage } from '../pages/ReportsPage';

export const PUBLIC_ROUTES = [
    {
        path: '/login',
        element: LoginPage,
        name: 'Login'
    },
    // {
    //     path: '/register',
    //     element: RegisterPage,
    //     name: 'Register'
    // }
];

export const PRIVATE_ROUTES = [
    {
        path: '/',
        element: DashboardPage,
        name: 'Dashboard Ejecutivo',
        icon: 'DashboardIcon'
    },
    // {
    //     path: '/sales',
    //     element: SalesPage,
    //     name: 'Ventas',
    //     icon: 'SalesIcon'
    // },
    // {
    //     path: '/inventory',
    //     element: InventoryPage,
    //     name: 'Inventario',
    //     icon: 'InventoryIcon'
    // },
    // {
    //     path: '/finance',
    //     element: FinancePage,
    //     name: 'Finanzas',
    //     icon: 'FinanceIcon'
    // },
    // {
    //     path: '/customers',
    //     element: CustomersPage,
    //     name: 'Clientes',
    //     icon: 'UsersIcon'
    // },
    // {
    //     path: '/reports',
    //     element: ReportsPage,
    //     name: 'Reportes',
    //     icon: 'ReportsIcon'
    // }
];

export const allRoutes = [...PUBLIC_ROUTES, ...PRIVATE_ROUTES];