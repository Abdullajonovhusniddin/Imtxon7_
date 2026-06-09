import axios from 'axios';

const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

// ─── File URL helper ──────────────────────────────────────────────────────────
export const getFileUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    const cleanPhoto = photo.startsWith('/') ? photo.slice(1) : photo;
    return `https://najot-edu.softwareengineer.uz/files/${cleanPhoto}`;
};

// ─── Axios instance ───────────────────────────────────────────────────────────
export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// Token interceptor (reference uslubida - sessionStorage)
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - 401 da logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('accessToken');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// ─── API_BASE (backward compat) ───────────────────────────────────────────────
export const API_BASE = BASE_URL;

export const buildApiUrl = (path = '') => {
    if (!path || path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = BASE_URL.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
};

// ─── Auth helpers (backward compat) ──────────────────────────────────────────
export const getAuthToken = () => sessionStorage.getItem('accessToken');

export const saveAuth = ({ token }) => {
    if (token) sessionStorage.setItem('accessToken', token);
};

const parseJwtPayload = (token) => {
    if (!token || typeof token !== 'string') return null;
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
};

export const getUserRole = () => {
    const payload = parseJwtPayload(getAuthToken());
    const role = payload?.role || payload?.type || payload?.user_role;
    return role ? String(role).toLowerCase() : '';
};

export const getStoredUser = () => {
    try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; }
};

// ─── Wrapper funksiyalar (backward compat) ────────────────────────────────────
export const getJson = async (path, options = {}) => {
    const response = await api.get(path, options);
    return response.data;
};

export const postJson = async (path, body, options = {}) => {
    const response = await api.post(path, body, options);
    return response.data;
};

export const putJson = async (path, body, options = {}) => {
    const response = await api.put(path, body, options);
    return response.data;
};

export const patchJson = async (path, body, options = {}) => {
    const response = await api.patch(path, body, options);
    return response.data;
};

export const deleteJson = async (path, options = {}) => {
    const response = await api.delete(path, options);
    return response.data;
};

export default api;
