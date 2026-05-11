import React from 'react';
import { useCustomers } from '../hooks/useCustomers.js';
import { formatDateTime, titleCase } from '../utils/formatters.js';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';

export const CustomersPage = () => {
    const { customers, loading, error } = useCustomers();

    const columns = [
        {
            header: 'ID',
            render: (row) => <span className="font-semibold text-slate-900">CLI-{row.id}</span>
        },
        { header: 'RUT', accessor: 'rut' },
        { header: 'Nombre', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Telefono',
            render: (row) => row.phone || 'Sin telefono'
        },
        {
            header: 'Tipo',
            render: (row) => titleCase(row.type)
        },
        {
            header: 'Registro',
            render: (row) => formatDateTime(row.registrationDate)
        }
    ];

    return (
        <div className="min-h-full bg-white p-6 text-slate-900">
            <div className="space-y-6">

                <PageHeader
                    title="Gestion de Clientes"
                    subtitle="Directorio conectado al microservicio de clientes."
                />

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={customers}
                    loading={loading}
                    emptyMessage="No hay clientes registrados."
                />

            </div>
        </div>
    );
};