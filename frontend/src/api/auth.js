// frontend/src/api/auth.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/', 
});

export const login = async (username, password) => {
  try {
    const response = await api.post('auth/token/', { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { non_field_errors: ['Ошибка сети'] };
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};