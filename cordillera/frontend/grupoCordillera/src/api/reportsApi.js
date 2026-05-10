import axiosInstance from './axiosInstance.js';

export const reportsApi = {
    async getAll() {
        const response = await axiosInstance.get('/api/reports');
        return response.data;
    },

    async generate(payload) {
        const response = await axiosInstance.post('/api/reports/generate', payload);
        return response.data;
    },

    async getById(id) {
        const response = await axiosInstance.get(`/api/reports/${id}`);
        return response.data;
    },
};
