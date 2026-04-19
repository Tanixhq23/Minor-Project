import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://healthlock-backend.onrender.com/api',
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // If using cookies, else we use headers below
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

export default api;
