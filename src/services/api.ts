import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // Using HTTP for local development

// Log the API URL for debugging
console.log('Using API URL:', API_BASE_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Don't follow redirects automatically
  maxRedirects: 0,
  validateStatus: function (status) {
    return status >= 200 && status < 400; // Accept 2xx and 3xx status codes
  }
});

// Add response interceptor to handle session cookies
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const api = {
  // Google OAuth login
  login: async (username: string): Promise<void> => {
    try {
      const response = await apiClient.get(`/login?username=${encodeURIComponent(username)}`, {
        withCredentials: true // Ensure credentials are sent
      });
      if (response.data.auth_url) {
        // Perform the redirect on the client side
        window.location.href = response.data.auth_url;
      } else {
        throw new Error('No auth URL received from server');
      }
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  },

  // Complete profile with resume and details
  completeProfile: async (username: string, data: { fullName: string, additionalDetails?: string }) => {
    const response = await apiClient.post('/complete_profile', {
      username,
      ...data
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    return response.data;
  },

  // Check credentials status
  checkCredentials: async (username: string) => {
    const response = await apiClient.get(`/check_credentials/${username}`, {
      withCredentials: true
    });
    return response.data;
  }
}; 