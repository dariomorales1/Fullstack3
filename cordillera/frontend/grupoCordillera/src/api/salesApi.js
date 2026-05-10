import axiosInstance from './axiosInstance.js';

export const salesApi = {
    async getAll() {
        const response = await axiosInstance.get('/api/sales');
        return response.data;
    },
};
