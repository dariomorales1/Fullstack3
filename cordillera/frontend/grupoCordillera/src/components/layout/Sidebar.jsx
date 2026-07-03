import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BadgeDollarSign,
    Users,
    BarChart3,
    TrendingUp,
    Mountain
} from 'lucide-react';
import { PRIVATE_ROUTES } from '../../router/routes';

const iconMap = {
    DashboardIcon: LayoutDashboard,
    SalesIcon: ShoppingCart,
    InventoryIcon: Package,
    FinanceIcon: BadgeDollarSign,
    UsersIcon: Users,
    ReportsIcon: BarChart3,
    TrendingUpIcon: TrendingUp
};

const Sidebar = () => {
    return (
        <aside className="flex h-full w-64 flex-col bg-brand-dark text-white">
            <div className="p-5 flex items-center gap-3 border-b border-slate-700/50">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Mountain className="text-white" size={18} />
                </div>
                <div>
                    <h1 className="text-sm font-bold tracking-wide text-white leading-tight">
                        Grupo Cordillera
                    </h1>
                    <p className="text-xs text-slate-400 font-medium">Panel de Gestión</p>
                </div>
            </div>

            <nav className="mt-4 flex-1 space-y-1 px-4">
                {PRIVATE_ROUTES.map((route) => {
                    const Icon = iconMap[route.icon];

                    return (
                        <NavLink
                            key={route.path}
                            to={route.path}
                            className={({ isActive }) =>
                                `flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            {Icon ? <Icon className="mr-3 h-5 w-5" /> : null}
                            {route.name}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
