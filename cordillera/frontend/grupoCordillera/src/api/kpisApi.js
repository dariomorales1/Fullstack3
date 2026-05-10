import axiosInstance from './axiosInstance.js';

export const kpisApi = {
    async getAll() {
        const response = await axiosInstance.get('/api/kpis');
        return response.data;
    },

    async getResultByPeriod(periodoId) {
        const response = await axiosInstance.get(`/api/kpis/periodo/${periodoId}`);
        return response.data;
    },

    async getLatestResult(id) {
        const response = await axiosInstance.get(`/api/kpis/${id}/resultado`);
        return response.data;
    },
};
