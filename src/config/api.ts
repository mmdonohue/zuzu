// src/config/api.ts
export const API_CONFIG = {
  API_URL: process.env.REACT_APP_API_URL || 
           (process.env.NODE_ENV === 'production' 
             ? 'https://zuzu-backend.onrender.com/api' 
             : 'http://localhost:5000/api'),
};