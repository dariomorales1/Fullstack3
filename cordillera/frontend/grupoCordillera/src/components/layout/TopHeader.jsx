import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Mountain, Menu } from 'lucide-react';

export const TopHeader = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-20">
            {/* Sección Izquierda: Menú móvil y Logo */}
            <div className="flex items-center gap-3">
                {toggleSidebar && (
                    <button
                        onClick={toggleSidebar}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-md md:hidden focus:outline-none"
                    >
                        <Menu size={20} />
                    </button>
                )}
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                    <Mountain className="text-white" size={18} />
                </div>
                <h1 className="text-lg font-bold text-slate-900 hidden sm:block">
                    Grupo Cordillera
                </h1>
            </div>

            {/* Sección Derecha: Usuario y Logout */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <div className="bg-slate-200 p-1 rounded-full text-slate-600">
                        <User size={14} />
                    </div>
                    <span className="hidden sm:inline-block font-medium">
                        {user?.nombre || 'Administrador'}
                    </span>
                </div>

                <div className="h-6 w-px bg-slate-200"></div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50 focus:outline-none"
                    title="Cerrar sesión"
                >
                    <span className="hidden sm:inline-block font-medium">Salir</span>
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};