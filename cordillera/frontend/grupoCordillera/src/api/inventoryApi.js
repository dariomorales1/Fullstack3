import axiosInstance from './axiosInstance.js';

export const inventoryApi = {
    async getAll() {
        const response = await axiosInstance.get('/api/inventory');
        return response.data;
    },
};
