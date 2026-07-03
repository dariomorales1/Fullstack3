import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mountain, RotateCcw } from 'lucide-react';
import { authApi } from '../../api/authApi.js';

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!successMessage) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            navigate('/login', { replace: true });
        }, 2000);

        return () => window.clearTimeout(timeoutId);
    }, [navigate, successMessage]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!token) {
            setError('El enlace de recuperacion no es valido');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('La contrasena debe tener al menos 6 caracteres');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Las contrasenas no coinciden');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await authApi.resetPassword(token, formData.newPassword);
            setSuccessMessage(response.message || 'Contrasena restablecida correctamente');
        } catch (err) {
            setError(err.response?.data?.message || 'No fue posible restablecer la contrasena');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="w-full max-w-[440px] bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-sm">
                        <Mountain className="text-white" size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Enlace invalido</h1>
                    <p className="text-sm text-slate-500 mt-2">No se encontro un token de recuperacion en la URL.</p>
                    <Link to="/login" className="inline-block mt-6 text-sm font-medium text-slate-900 hover:underline">
                        Volver a iniciar sesion
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-[440px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="pt-10 pb-6 px-8 text-center border-b border-slate-100">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-sm">
                        <Mountain className="text-white" size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Nueva contrasena</h1>
                    <p className="text-sm text-slate-500 mt-1">Define una contrasena segura para tu cuenta</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100 text-center">
                            {successMessage}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-sm text-slate-700" htmlFor="newPassword">Nueva contrasena</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                id="newPassword"
                                name="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.newPassword}
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
                        {isSubmitting ? 'Restableciendo...' : 'Restablecer contrasena'}
                        {!isSubmitting && <RotateCcw size={18} />}
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
