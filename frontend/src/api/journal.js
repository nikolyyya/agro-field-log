// frontend/src/api/journal.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/',
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const getWorkEntries = async (params = {}) => {
  try {
    const response = await api.get('work-entries/', { params });
    return response.data; 
  } catch (error) {
    throw error.response?.data || { detail: 'Ошибка загрузки журнала' };
  }
};

export const getFields = async () => {
  try {
    const response = await api.get('fields/');
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Ошибка загрузки полей' };
  }
};

export const getSeasons = async () => {
  try {
    const response = await api.get('seasons/');
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Ошибка загрузки сезонов' };
  }
};