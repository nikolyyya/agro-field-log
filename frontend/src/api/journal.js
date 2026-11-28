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
export const createWorkEntry = async (data) => {
  try {
    const response = await api.post('work-entries/', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Ошибка создания записи' };
  }
};
export const updateWorkEntry = async (id, data) => {
  try {
    const response = await api.patch(`work-entries/${id}/`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Ошибка обновления записи' };
  }
};
export const deleteWorkEntry = async (id) => {
  try {
    await api.delete(`work-entries/${id}/`);
    return true; 
  } catch (error) {
    throw error.response?.data || { detail: 'Ошибка удаления записи' };
  }
};
export const getPlantings = async () => {
  try {
    const response = await api.get('plantings/');
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Ошибка загрузки посевов' };
  }
};