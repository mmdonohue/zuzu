// API service for making requests to the backend

import { API_CONFIG } from '../config/api';

// Base API URL
const API_URL =  API_CONFIG.API_URL;

// Helper for handling response status
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `API error: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

// Example API function to fetch a hello message
export const fetchHello = async () => {
  try {
    const response = await fetch(`${API_URL}/hello`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching hello message:', error);
    throw error;
  }
};

// Mock users for the dashboard example
// In a real app, you would fetch this from the API
export const fetchUsers = async () => {
  // Simulate API call with timeout
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock users data
  return [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      lastActive: '2025-03-30',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Editor',
      lastActive: '2025-03-29',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'User',
      lastActive: '2025-03-28',
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      role: 'User',
      lastActive: '2025-03-27',
    },
    {
      id: 5,
      name: 'Alex Brown',
      email: 'alex.brown@example.com',
      role: 'Editor',
      lastActive: '2025-03-26',
    },
  ];
};

// Add more API functions as needed