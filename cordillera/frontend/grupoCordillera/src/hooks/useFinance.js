import { useEffect, useState } from 'react';
import { financeApi } from '../api/financeApi.js';

export const useFinance = () => {
    const [movements, setMovements] = useState([]);
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchFinance = async () => {
        setLoading(true);
        setError('');

        try {
            const [movementsData, balancesData] = await Promise.all([
                financeApi.getMovements(),
                financeApi.getBalances(),
            ]);

            setMovements(Array.isArray(movementsData) ? movementsData : []);
            setBalances(Array.isArray(balancesData) ? balancesData : []);
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || 'No se pudieron cargar las finanzas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinance();
    }, []);

    return { movements, balances, loading, error, refetch: fetchFinance };
};
