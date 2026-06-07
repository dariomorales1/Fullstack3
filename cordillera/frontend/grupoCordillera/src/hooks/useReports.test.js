import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useReports } from './useReports';
import { reportsApi } from '../api/reportsApi';

vi.mock('../api/reportsApi');

describe('useReports', () => {
    beforeEach(() => vi.clearAllMocks());

    it('carga reportes al montar', async () => {
        const mockData = [{ id: 1, tipo: 'KPI_MENSUAL' }];
        reportsApi.getAll.mockResolvedValue(mockData);

        const { result } = renderHook(() => useReports());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.reports).toEqual(mockData);
    });

    it('captura error correctamente', async () => {
        reportsApi.getAll.mockRejectedValue(new Error('Error'));

        const { result } = renderHook(() => useReports());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBeTruthy();
    });

    it('refetch recarga la lista', async () => {
        reportsApi.getAll.mockResolvedValue([{ id: 1 }]);
        const { result } = renderHook(() => useReports());

        await waitFor(() => expect(result.current.loading).toBe(false));

        reportsApi.getAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        await act(async () => result.current.refetch());

        await waitFor(() => expect(result.current.reports).toHaveLength(2));
    });
});
