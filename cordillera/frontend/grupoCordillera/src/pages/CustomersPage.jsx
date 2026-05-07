import React from 'react';

const customers = [
    { id: 'CLI-001', rut: '12.345.678-9', name: 'Andina Corp', email: 'contacto@andina.cl', type: 'Empresa' },
    { id: 'CLI-002', rut: '98.765.432-1', name: 'Juan Perez', email: 'jperez@email.com', type: 'Persona Natural' },
    { id: 'CLI-003', rut: '45.678.901-2', name: 'Sierra Logistics', email: 'info@sierra.cl', type: 'Empresa' }
];

export const CustomersPage = () => {
    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Gestion de Clientes</h1>
                    <p className="mt-1 text-sm text-slate-500">Directorio estatico de clientes prioritarios.</p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-4">ID</th>
                                    <th className="px-4 py-4">RUT</th>
                                    <th className="px-4 py-4">Nombre</th>
                                    <th className="px-4 py-4">Email</th>
                                    <th className="px-4 py-4">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                                {customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td className="px-4 py-4 font-semibold text-slate-900">{customer.id}</td>
                                        <td className="px-4 py-4">{customer.rut}</td>
                                        <td className="px-4 py-4">{customer.name}</td>
                                        <td className="px-4 py-4">{customer.email}</td>
                                        <td className="px-4 py-4">{customer.type}</td>
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
