import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { RegisterPage } from '../pages/auth/RegisterPage.jsx';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { SalesPage } from '../pages/SalesPage.jsx';
import { InventoryPage } from '../pages/InventoryPage.jsx';
import { FinancePage } from '../pages/FinancePage.jsx';
import { CustomersPage } from '../pages/CustomersPage.jsx';
import { ReportsPage } from '../pages/ReportsPage.jsx';
import { KpisPage } from '../pages/KpisPage.jsx';

export const PUBLIC_ROUTES = [
    {
        path: '/login',
        element: LoginPage,
        name: 'Login'
    },
    {
        path: '/register',
        element: RegisterPage,
        name: 'Register'
    },
    {
        path: '/forgot-password',
        element: ForgotPasswordPage,
        name: 'ForgotPassword'
    },
    {
        path: '/reset-password',
        element: ResetPasswordPage,
        name: 'ResetPassword'
    }
];

export const PRIVATE_ROUTES = [
    {
        path: '/',
        element: DashboardPage,
        name: 'Dashboard',
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
    },
    {
        path: '/kpis',
        element: KpisPage,
        name: 'KPIs',
        icon: 'TrendingUpIcon'
    }
];

export const allRoutes = [...PUBLIC_ROUTES, ...PRIVATE_ROUTES];
