import axiosInstance from './axiosInstance.js';

export const dashboardApi = {
    async getDashboard() {
        const response = await axiosInstance.get('/api/dashboard');
        return response.data;
    },
};
