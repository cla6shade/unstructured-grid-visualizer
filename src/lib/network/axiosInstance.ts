import axios from 'axios';
import { API_KEY_STORAGE_KEY } from '@/constants/auth';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_TILE_SERVER_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }
  return config;
});
