// src/api/axios.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: baseURL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // FIX: Jangan redirect ke /login jika error 401 berasal dari proses login itu sendiri!
                    if (!error.config.url.includes('/login')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        globalThis.location.href = '/login';
                    }
                    break;
                case 403:
                    console.error('Access forbidden:', error.response.data);
                    break;
                case 404:
                    console.error('Endpoint not found:', error.config.url);
                    break;
                case 500:
                    console.error('Server error:', error.response.data);
                    break;
                default:
                    console.error('API Error:', error.response.data);
            }
        }
        return Promise.reject(error);
    }
);

export default api;