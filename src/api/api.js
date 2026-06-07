import axios from 'axios';
const endpoint = 'https://najot-edu.softwareengineer.uz/api/v1';

export const getFileUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    const cleanPhoto = photo.startsWith('/') ? photo.slice(1) : photo;
    return `https://najot-edu.softwareengineer.uz/files/${cleanPhoto}`;
};

export const api = axios.create({
  baseURL: endpoint,
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
