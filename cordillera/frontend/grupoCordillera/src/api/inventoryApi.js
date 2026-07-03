import axiosInstance from './axiosInstance.js';

export const inventoryApi = {
    async getAll() {
        const response = await axiosInstance.get('/api/inventory');
        return response.data;
    },

    async create(payload) {
        const response = await axiosInstance.post('/api/inventory', payload);
        return response.data;
    },
};
