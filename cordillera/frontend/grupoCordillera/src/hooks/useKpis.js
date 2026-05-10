import { useEffect, useState } from 'react';
import { kpisApi } from '../api/kpisApi.js';

export const useKpis = (periodoId) => {
    const [kpis, setKpis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchKpis = async () => {
        setLoading(true);
        setError('');

        try {
            const [indicadores, resultados] = await Promise.all([
                kpisApi.getAll(),
                kpisApi.getResultByPeriod(periodoId),
            ]);

            const resultadosMap = new Map(
                (Array.isArray(resultados) ? resultados : []).map((resultado) => [resultado.indicadorId, resultado])
            );

            const merged = (Array.isArray(indicadores) ? indicadores : []).map((indicador) => ({
                ...indicador,
                resultado: resultadosMap.get(indicador.id) || null,
            }));

            setKpis(merged);
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || 'No se pudieron cargar los KPIs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKpis();
    }, [periodoId]);

    return { kpis, loading, error, refetch: fetchKpis };
};
