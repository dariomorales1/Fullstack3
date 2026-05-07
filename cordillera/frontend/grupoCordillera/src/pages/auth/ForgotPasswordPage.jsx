import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Mountain, Send } from 'lucide-react';
import { authApi } from '../../api/authApi.js';

const ALLOWED_EMAIL_MESSAGE = 'Solo se permiten emails corporativos (@cordillera.cl) o autorizados';

const isAllowedEmail = (email) => {
    const normalized = email.trim().toLowerCase();
    return normalized.endsWith('@cordillera.cl') || normalized === 'fe.ulloao@duocuc.cl';
};

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        const normalizedEmail = email.trim().toLowerCase();

        if (!isAllowedEmail(normalizedEmail)) {
            setError(ALLOWED_EMAIL_MESSAGE);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await authApi.forgotPassword(normalizedEmail);
            setSuccessMessage(
                response.message || 'Si el email existe en el sistema, recibiras un enlace en los proximos minutos.'
            );
        } catch (err) {
            setError(err.response?.data?.message || 'No fue posible procesar la solicitud');
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
                    <h1 className="text-xl font-bold text-slate-900">Recuperar contrasena</h1>
                    <p className="text-sm text-slate-500 mt-1">Te enviaremos un enlace de recuperacion</p>
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
                        <label className="block text-sm text-slate-700" htmlFor="email">Correo electronico</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="nombre@cordillera.cl"
                                required
                                disabled={isSubmitting}
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
                            />
                        </div>
                        <p className="text-xs text-slate-500">{ALLOWED_EMAIL_MESSAGE}</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Enviando enlace...' : 'Enviar enlace de recuperacion'}
                        {!isSubmitting && <Send size={18} />}
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
