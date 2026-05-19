import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const authAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const attachToken = (config) => {
    const token = window.sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

const handleRequestError = (error) => Promise.reject(error);

const handleResponseError = (error) => {
    if (error.response?.status === 401) {
        // Si el backend dice que el token no sirve, limpiamos y mandamos al login
        window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
};

axiosInstance.interceptors.request.use(
    attachToken,
    handleRequestError
);

authAxios.interceptors.request.use(
    attachToken,
    handleRequestError
);

axiosInstance.interceptors.response.use(
    (response) => response,
    handleResponseError
);

authAxios.interceptors.response.use(
    (response) => response,
    handleResponseError
);

export default axiosInstance;
