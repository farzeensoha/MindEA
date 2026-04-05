import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('mindease-token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('mindease-token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('mindease-token');
};

export const initializeAuth = () => {
  const token = getAuthToken();
  if (token) {
    setAuthToken(token);
  }
};