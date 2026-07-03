import { useEffect, useState } from 'react';
import { customersApi } from '../api/customersApi.js';

export const useCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCustomers = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await customersApi.getAll();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || 'No se pudieron cargar los clientes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    return { customers, loading, error, refetch: fetchCustomers };
};
