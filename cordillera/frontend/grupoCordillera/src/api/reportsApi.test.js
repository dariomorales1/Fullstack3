import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportsApi } from './reportsApi';
import axiosInstance from './axiosInstance';

vi.mock('./axiosInstance', () => ({
    default: { get: vi.fn(), post: vi.fn() },
}));

describe('reportsApi', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getAll llama GET /api/reports y retorna data', async () => {
        const mockData = [{ id: 1, tipo: 'KPI_MENSUAL' }];
        axiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await reportsApi.getAll();

        expect(axiosInstance.get).toHaveBeenCalledWith('/api/reports');
        expect(result).toEqual(mockData);
    });

    it('getById llama GET /api/reports/:id', async () => {
        axiosInstance.get.mockResolvedValue({ data: { id: 5 } });

        const result = await reportsApi.getById(5);

        expect(axiosInstance.get).toHaveBeenCalledWith('/api/reports/5');
        expect(result.id).toBe(5);
    });

    it('generate llama POST /api/reports/generate con payload', async () => {
        const payload = { tipo: 'KPI_MENSUAL' };
        axiosInstance.post.mockResolvedValue({ data: { id: 10 } });

        const result = await reportsApi.generate(payload);

        expect(axiosInstance.post).toHaveBeenCalledWith('/api/reports/generate', payload);
        expect(result.id).toBe(10);
    });
});
