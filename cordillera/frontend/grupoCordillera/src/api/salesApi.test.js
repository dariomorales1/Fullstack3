import { describe, it, expect, vi, beforeEach } from 'vitest';
import { salesApi } from './salesApi';
import axiosInstance from './axiosInstance';

vi.mock('./axiosInstance', () => ({
    default: { get: vi.fn(), post: vi.fn() },
}));

describe('salesApi', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getAll llama GET /api/sales y retorna data', async () => {
        const mockData = [{ id: 1, amount: 1000 }];
        axiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await salesApi.getAll();

        expect(axiosInstance.get).toHaveBeenCalledWith('/api/sales');
        expect(result).toEqual(mockData);
    });

    it('create llama POST /api/sales con payload y retorna data', async () => {
        const payload = { amount: 5000, branchId: 1 };
        const mockData = { id: 2, ...payload };
        axiosInstance.post.mockResolvedValue({ data: mockData });

        const result = await salesApi.create(payload);

        expect(axiosInstance.post).toHaveBeenCalledWith('/api/sales', payload);
        expect(result).toEqual(mockData);
    });
});
