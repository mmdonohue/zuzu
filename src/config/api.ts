// src/config/api.ts
const api_port = process.env.REACT_APP_API_PORT || '5000';
export const API_CONFIG = {
  API_URL: process.env.REACT_APP_API_URL || 
           (process.env.NODE_ENV === 'production' 
             ? 'https://zuzu-backend.onrender.com/api' 
             : `http://localhost:${api_port}/api`),
};