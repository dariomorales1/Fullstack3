import axiosInstance from './axiosInstance.js';

export const salesApi = {
    async getAll() {
        const response = await axiosInstance.get('/api/sales');
        return response.data;
    },

    async create(payload) {
        const response = await axiosInstance.post('/api/sales', payload);
        return response.data;
    },
};
