import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If 401 Unauthorized, clear token and redirect to login
        if (error.response && error.response.status === 401) {
            const token = localStorage.getItem('token');
            // Only redirect if we had a token (session expired)
            if (token) {
                localStorage.removeItem('token');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
