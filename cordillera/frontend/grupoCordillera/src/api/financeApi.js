import axiosInstance from './axiosInstance.js';

export const financeApi = {
    async getMovements() {
        const response = await axiosInstance.get('/api/finance/movements');
        return response.data;
    },

    async getBalances() {
        const response = await axiosInstance.get('/api/finance/balances');
        return response.data;
    },

    async createMovement(payload) {
        const response = await axiosInstance.post('/api/finance/movements', payload);
        return response.data;
    },
};
