import React from 'react';
import { useCustomers } from '../hooks/useCustomers.js';
import { formatDateTime, titleCase } from '../utils/formatters.js';

export const CustomersPage = () => {
    const { customers, loading, error } = useCustomers();

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Gestion de Clientes</h1>
                    <p className="mt-1 text-sm text-slate-500">Directorio conectado al microservicio de clientes.</p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    {error ? (
                        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                    ) : null}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-4">ID</th>
                                    <th className="px-4 py-4">RUT</th>
                                    <th className="px-4 py-4">Nombre</th>
                                    <th className="px-4 py-4">Email</th>
                                    <th className="px-4 py-4">Telefono</th>
                                    <th className="px-4 py-4">Tipo</th>
                                    <th className="px-4 py-4">Registro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">Cargando clientes...</td>
                                    </tr>
                                ) : null}
                                {!loading && !customers.length ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">No hay clientes registrados.</td>
                                    </tr>
                                ) : null}
                                {!loading && customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td className="px-4 py-4 font-semibold text-slate-900">CLI-{customer.id}</td>
                                        <td className="px-4 py-4">{customer.rut}</td>
                                        <td className="px-4 py-4">{customer.name}</td>
                                        <td className="px-4 py-4">{customer.email}</td>
                                        <td className="px-4 py-4">{customer.phone || 'Sin telefono'}</td>
                                        <td className="px-4 py-4">{titleCase(customer.type)}</td>
                                        <td className="px-4 py-4">{formatDateTime(customer.registrationDate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
