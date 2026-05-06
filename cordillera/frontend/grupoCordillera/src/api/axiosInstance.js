import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = window.sessionStorage.getItem('token'); // Temporal hasta tener el Context
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Si el BFF dice que el token no sirve, limpiamos y mandamos al login
            window.dispatchEvent(new Event('auth-error'));
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;