import { useEffect, useState } from 'react';
import { reportsApi } from '../api/reportsApi.js';

export const useReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReports = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await reportsApi.getAll();
            setReports(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || 'No se pudieron cargar los reportes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const generateReport = async (payload) => {
        const createdReport = await reportsApi.generate(payload);
        setReports((current) => [createdReport, ...current]);
        return createdReport;
    };

    return { reports, loading, error, refetch: fetchReports, generateReport };
};
