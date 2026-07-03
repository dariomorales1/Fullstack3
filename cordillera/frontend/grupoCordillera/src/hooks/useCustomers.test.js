import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCustomers } from './useCustomers';
import { customersApi } from '../api/customersApi';

vi.mock('../api/customersApi');

describe('useCustomers', () => {
    beforeEach(() => vi.clearAllMocks());

    it('estado inicial: loading=true, customers=[], error=""', () => {
        customersApi.getAll.mockResolvedValue([]);
        const { result } = renderHook(() => useCustomers());
        expect(result.current.loading).toBe(true);
        expect(result.current.customers).toEqual([]);
        expect(result.current.error).toBe('');
    });

    it('carga clientes al montar', async () => {
        const mockData = [{ id: 1, name: 'Empresa A' }];
        customersApi.getAll.mockResolvedValue(mockData);

        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.customers).toEqual(mockData);
    });

    it('loading pasa a false despues del fetch', async () => {
        customersApi.getAll.mockResolvedValue([]);
        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('captura error de API', async () => {
        customersApi.getAll.mockRejectedValue({
            response: { data: { message: 'Error del servidor' } },
        });

        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Error del servidor');
        expect(result.current.customers).toEqual([]);
    });

    it('usa mensaje default si el error no tiene response.data.message', async () => {
        customersApi.getAll.mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('No se pudieron cargar los clientes.');
    });

    it('maneja array vacio sin error', async () => {
        customersApi.getAll.mockResolvedValue([]);
        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.customers).toEqual([]);
        expect(result.current.error).toBe('');
    });

    it('convierte respuesta no-array en []', async () => {
        customersApi.getAll.mockResolvedValue({ id: 1 });
        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.customers).toEqual([]);
    });

    it('refetch vuelve a cargar los datos', async () => {
        customersApi.getAll.mockResolvedValue([{ id: 1 }]);
        const { result } = renderHook(() => useCustomers());

        await waitFor(() => expect(result.current.loading).toBe(false));

        customersApi.getAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        await act(async () => result.current.refetch());

        await waitFor(() => expect(result.current.customers).toHaveLength(2));
    });
});
