import { authAxios } from './axiosInstance.js';

export const authApi = {
    login: async (credentials) => {
        const response = await authAxios.post('/api/auth/login', credentials);
        return response.data;
    },

    register: async (userData) => {
        const response = await authAxios.post('/api/auth/register', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        const response = await authAxios.post('/api/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token, newPassword) => {
        const response = await authAxios.post('/api/auth/reset-password', { token, newPassword });
        return response.data;
    },

    changePassword: async (data) => {
        const response = await authAxios.post('/api/auth/change-password', data);
        return response.data;
    },

    validateToken: async () => {
        const response = await authAxios.get('/api/auth/validate');
        return response.data;
    },
};
