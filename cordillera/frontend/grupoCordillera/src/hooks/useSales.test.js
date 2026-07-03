import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSales } from './useSales';
import { salesApi } from '../api/salesApi';

vi.mock('../api/salesApi');

describe('useSales', () => {
    beforeEach(() => vi.clearAllMocks());

    it('estado inicial: loading=true, sales=[]', () => {
        salesApi.getAll.mockResolvedValue([]);
        const { result } = renderHook(() => useSales());
        expect(result.current.loading).toBe(true);
        expect(result.current.sales).toEqual([]);
    });

    it('carga ventas al montar', async () => {
        const mockData = [{ id: 1, amount: 5000 }];
        salesApi.getAll.mockResolvedValue(mockData);

        const { result } = renderHook(() => useSales());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.sales).toEqual(mockData);
    });

    it('captura error de API', async () => {
        salesApi.getAll.mockRejectedValue({
            response: { data: { message: 'Error ventas' } },
        });

        const { result } = renderHook(() => useSales());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Error ventas');
    });

    it('usa mensaje default si error no tiene message', async () => {
        salesApi.getAll.mockRejectedValue(new Error('Network'));

        const { result } = renderHook(() => useSales());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('No se pudieron cargar las ventas.');
    });

    it('convierte respuesta no-array en []', async () => {
        salesApi.getAll.mockResolvedValue(null);

        const { result } = renderHook(() => useSales());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.sales).toEqual([]);
    });

    it('refetch recarga los datos', async () => {
        salesApi.getAll.mockResolvedValue([{ id: 1 }]);
        const { result } = renderHook(() => useSales());

        await waitFor(() => expect(result.current.loading).toBe(false));

        salesApi.getAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        await act(async () => result.current.refetch());

        await waitFor(() => expect(result.current.sales).toHaveLength(2));
    });
});
