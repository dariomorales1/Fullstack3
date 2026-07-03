import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kpisApi } from './kpisApi';
import axiosInstance from './axiosInstance';

vi.mock('./axiosInstance', () => ({
    default: { get: vi.fn() },
}));

describe('kpisApi', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getAll llama GET /api/kpis y retorna data', async () => {
        const mockData = [{ id: 1, codigo: 'KPI-001' }];
        axiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await kpisApi.getAll();

        expect(axiosInstance.get).toHaveBeenCalledWith('/api/kpis');
        expect(result).toEqual(mockData);
    });

    it('getResultByPeriod llama GET /api/kpis/periodo/:id', async () => {
        axiosInstance.get.mockResolvedValue({ data: [] });

        await kpisApi.getResultByPeriod(3);

        expect(axiosInstance.get).toHaveBeenCalledWith('/api/kpis/periodo/3');
    });

    it('getLatestResult llama GET /api/kpis/:id/resultado', async () => {
        axiosInstance.get.mockResolvedValue({ data: { estado: 'CUMPLIDO' } });

        const result = await kpisApi.getLatestResult(1);

        expect(axiosInstance.get).toHaveBeenCalledWith('/api/kpis/1/resultado');
        expect(result.estado).toBe('CUMPLIDO');
    });
});
