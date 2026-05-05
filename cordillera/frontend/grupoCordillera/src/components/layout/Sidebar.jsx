import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BadgeDollarSign,
    Users,
    BarChart3,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PRIVATE_ROUTES } from '../../router/routes';

const iconMap = {
    DashboardIcon: LayoutDashboard,
    SalesIcon: ShoppingCart,
    InventoryIcon: Package,
    FinanceIcon: BadgeDollarSign,
    UsersIcon: Users,
    ReportsIcon: BarChart3
};

const Sidebar = () => {
    const { logout } = useAuth();

    return (
        <aside className="w-64 bg-brand-dark text-white flex flex-col h-full">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight text-white uppercase">
                    Grupo Cordillera
                </h1>
                <p className="text-xs text-blue-400 font-medium">Panel de Gestión</p>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {PRIVATE_ROUTES.map((route) => {
                    const Icon = iconMap[route.icon];
                    return (
                        <NavLink
                            key={route.path}
                            to={route.path}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            {Icon && <Icon className="mr-3 h-5 w-5" />}
                            {route.name}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-400 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;