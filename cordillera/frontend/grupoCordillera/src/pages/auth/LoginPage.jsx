import React, { useState } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff, LogIn, HeadphonesIcon, Mountain } from 'lucide-react';

export const LoginPage = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Mock temporal. Reemplazar por authApi.
            if (credentials.email === 'admin@grupocordillera.com' && credentials.password === 'admin') {
                const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock';
                const mockUser = { id: 1, nombre: 'Admin Cordillera', email: credentials.email };

                login(mockUser, mockToken);
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error('Credenciales inválidas');
            }
        } catch (err) {
            setError(err.message || 'Error al conectar con el servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 relative overflow-hidden">

            {/* Formas decorativas de fondo (Montañas) */}
            <div className="absolute bottom-0 left-0 w-full h-64 bg-slate-100 transform origin-bottom-left -skew-y-6 z-0"></div>
            <div className="absolute bottom-0 right-0 w-1/2 h-80 bg-slate-200 transform origin-bottom-right skew-y-12 opacity-40 z-0"></div>

            {/* Contenedor Principal */}
            <main className="flex-grow flex items-center justify-center p-4 z-10">
                <div className="w-full max-w-[420px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">

                    {/* Cabecera de Tarjeta */}
                    <div className="pt-10 pb-6 px-8 text-center border-b border-slate-100">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-sm">
                            <Mountain className="text-white" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Grupo Cordillera</h2>
                        <p className="text-sm text-slate-500 mt-1">Management Portal</p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-sm text-slate-700" htmlFor="email">Correo electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="nombre@grupocordillera.com"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm text-slate-700" htmlFor="password">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting}
                                    className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    tabIndex="-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isSubmitting}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600 cursor-pointer">
                                Mantener sesión iniciada
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                            {!isSubmitting && <LogIn size={18} />}
                        </button>
                    </form>

                    {/* Enlaces de Soporte */}
                    <div className="px-8 pb-8 text-center space-y-5">
                        <div className="flex flex-col space-y-3">
                            <Link to="/recuperar" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">
                                ¿Olvidó su contraseña?
                            </Link>
                            <Link to="/register" className="text-sm font-medium text-slate-900 hover:underline transition-all">
                                ¿No tienes una cuenta? Regístrate
                            </Link>
                        </div>

                        <div className="border-t border-slate-100 pt-5 space-y-2">
                            <p className="text-xs text-slate-500">¿Necesita ayuda con el portal?</p>
                            <a href="mailto:soporte@grupocordillera.com" className="text-sm text-slate-700 font-medium hover:text-slate-900 flex items-center justify-center gap-1.5 transition-colors">
                                <HeadphonesIcon size={16} className="text-slate-500" />
                                Contactar a Soporte IT
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            {/* Pie de Página */}
            <footer className="w-full py-5 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 z-10 bg-transparent gap-4">
                <div>
                    © 2026 Grupo Cordillera. Todos los derechos reservados.
                </div>
                <div className="flex items-center gap-6">
                    <a href="/privacidad" className="hover:text-slate-800 transition-colors">Aviso de Privacidad</a>
                    <a href="/terminos" className="hover:text-slate-800 transition-colors">Términos de Uso</a>
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Sistemas Operativos
                    </div>
                </div>
            </footer>
        </div>
    );
};