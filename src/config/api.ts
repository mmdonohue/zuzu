// src/config/api.ts
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 
           (process.env.NODE_ENV === 'production' 
             ? 'https://zuzu-backend.onrender.com' 
             : 'http://localhost:5000'),
};