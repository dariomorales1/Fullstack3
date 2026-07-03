import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardApi } from './dashboardApi';
import axiosInstance from './axiosInstance';

vi.mock('./axiosInstance', () => ({
    default: { get: vi.fn() },
}));

describe('dashboardApi', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getDashboard llama GET /api/dashboard y retorna data', async () => {
        const mockData = { summary: { kpisCumplidos: 3 }, degraded: false };
        axiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await dashboardApi.getDashboard();

        expect(axiosInstance.get).toHaveBeenCalledWith('/api/dashboard');
        expect(result.degraded).toBe(false);
    });

    it('getDashboard maneja respuesta degraded', async () => {
        const mockData = { summary: {}, degraded: true };
        axiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await dashboardApi.getDashboard();

        expect(result.degraded).toBe(true);
    });
});
