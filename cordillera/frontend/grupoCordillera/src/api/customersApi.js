import axiosInstance from './axiosInstance.js';

export const customersApi = {
    async getAll() {
        const response = await axiosInstance.get('/api/customers');
        return response.data;
    },
};
