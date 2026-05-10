import { useEffect, useState } from 'react';
import { salesApi } from '../api/salesApi.js';

export const useSales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSales = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await salesApi.getAll();
            setSales(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || 'No se pudieron cargar las ventas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    return { sales, loading, error, refetch: fetchSales };
};
