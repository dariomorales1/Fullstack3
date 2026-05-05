import axiosInstance from './axiosInstance';

export const authApi = {
    // Envía credenciales al BFF y recibe el JWT
    login: async (credentials) => {
        const response = await axiosInstance.post('/api/auth/login', credentials);
        return response.data; // { user: {...}, token: "ey..." }
    },

    // Método preparado para recuperar el perfil mediante el token
    getUserProfile: async () => {
        const response = await axiosInstance.get('/api/auth/me');
        return response.data;
    }
};