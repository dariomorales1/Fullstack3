import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useKpis } from './useKpis';
import { kpisApi } from '../api/kpisApi';

vi.mock('../api/kpisApi');

describe('useKpis', () => {
    beforeEach(() => vi.clearAllMocks());

    it('estado inicial: loading=true', () => {
        kpisApi.getAll.mockResolvedValue([]);
        kpisApi.getResultByPeriod.mockResolvedValue([]);
        const { result } = renderHook(() => useKpis());
        expect(result.current.loading).toBe(true);
    });

    it('carga KPIs al montar', async () => {
        const mockIndicadores = [{ id: 1, codigo: 'KPI-001', estado: 'CUMPLIDO' }];
        kpisApi.getAll.mockResolvedValue(mockIndicadores);
        kpisApi.getResultByPeriod.mockResolvedValue([]);

        const { result } = renderHook(() => useKpis());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.kpis).toEqual([{ id: 1, codigo: 'KPI-001', estado: 'CUMPLIDO', resultado: null }]);
    });

    it('captura error correctamente', async () => {
        kpisApi.getAll.mockRejectedValue({ response: { data: { message: 'Error KPI' } } });
        kpisApi.getResultByPeriod.mockResolvedValue([]);

        const { result } = renderHook(() => useKpis());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBeTruthy();
    });

    it('refetch recarga los datos', async () => {
        kpisApi.getAll.mockResolvedValue([{ id: 1 }]);
        kpisApi.getResultByPeriod.mockResolvedValue([]);
        const { result } = renderHook(() => useKpis());

        await waitFor(() => expect(result.current.loading).toBe(false));

        kpisApi.getAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        await act(async () => result.current.refetch());

        await waitFor(() => expect(result.current.kpis).toHaveLength(2));
    });
});
