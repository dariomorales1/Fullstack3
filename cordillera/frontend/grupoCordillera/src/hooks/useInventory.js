import { useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventoryApi.js';

export const useInventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInventory = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await inventoryApi.getAll();
            setProducts(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || 'No se pudo cargar el inventario.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    return { products, loading, error, refetch: fetchInventory };
};
