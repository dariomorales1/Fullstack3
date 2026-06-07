import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customersApi } from './customersApi';
import axiosInstance from './axiosInstance';

vi.mock('./axiosInstance', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('customersApi', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getAll llama GET /api/customers y retorna data', async () => {
        const mockData = [{ id: 1, name: 'Empresa Test' }];
        axiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await customersApi.getAll();

        expect(axiosInstance.get).toHaveBeenCalledWith('/api/customers');
        expect(result).toEqual(mockData);
    });
});
