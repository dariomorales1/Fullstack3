import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Mountain, ShieldCheck, UserPlus } from 'lucide-react';
import { authApi } from '../../api/authApi.js';

const ALLOWED_EMAIL_MESSAGE = 'Solo se permiten emails corporativos (@cordillera.cl) o autorizados';

const isAllowedEmail = (email) => {
    const normalized = email.trim().toLowerCase();
    return normalized.endsWith('@cordillera.cl') || normalized === 'fe.ulloao@duocuc.cl';
};

export const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'USER',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        const normalizedEmail = formData.email.trim().toLowerCase();

        if (!isAllowedEmail(normalizedEmail)) {
            setError(ALLOWED_EMAIL_MESSAGE);
            return;
        }

        if (formData.password.length < 6) {
            setError('La contrasena debe tener al menos 6 caracteres');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contrasenas no coinciden');
            return;
        }

        setIsSubmitting(true);

        try {
            await authApi.register({
                email: normalizedEmail,
                password: formData.password,
                role: formData.role,
            });
            navigate('/login', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'No fue posible crear la cuenta');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-[440px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="pt-10 pb-6 px-8 text-center border-b border-slate-100">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-sm">
                        <Mountain className="text-white" size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Crear cuenta</h1>
                    <p className="text-sm text-slate-500 mt-1">Acceso corporativo Grupo Cordillera</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-sm text-slate-700" htmlFor="email">Correo electronico</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="nombre@cordillera.cl"
                                required
                                disabled={isSubmitting}
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
                            />
                        </div>
                        <p className="text-xs text-slate-500">{ALLOWED_EMAIL_MESSAGE}</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm text-slate-700" htmlFor="role">Rol</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="w-full appearance-none pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
                            >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm text-slate-700" htmlFor="password">Contrasena</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Minimo 6 caracteres"
                                required
                                disabled={isSubmitting}
                                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm text-slate-700" htmlFor="confirmPassword">Confirmar contrasena</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repite la contrasena"
                                required
                                disabled={isSubmitting}
                                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                        {!isSubmitting && <UserPlus size={18} />}
                    </button>
                </form>

                <div className="px-8 pb-8 text-center">
                    <Link to="/login" className="text-sm font-medium text-slate-900 hover:underline">
                        Volver a iniciar sesion
                    </Link>
                </div>
            </div>
        </div>
    );
};
