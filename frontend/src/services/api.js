import axios from 'axios';

// Base URL: falls back to relative /api which Vite proxies to http://localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // System Health
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Dynamic Dashboard Aggregate Stats
  getDashboardStats: async () => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data;
  },

  // Log Analysis (Manual text or Multipart file)
  analyzeLogs: async (payload, isFileUpload = false) => {
    if (isFileUpload) {
      const formData = new FormData();
      formData.append('file', payload);
      const res = await apiClient.post('/logs/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    }

    const res = await apiClient.post('/logs/analyze', { logsText: payload });
    return res.data;
  },

  // Query Network Logs with filters and pagination
  getLogs: async (params = {}) => {
    const res = await apiClient.get('/logs', { params });
    return res.data;
  },

  // Retrieve single log by ID
  getLogById: async (id) => {
    const res = await apiClient.get(`/logs/${id}`);
    return res.data;
  },

  // Query Security Alerts
  getAlerts: async (params = {}) => {
    const res = await apiClient.get('/alerts', { params });
    return res.data;
  },

  // Retrieve sample logs & test scenarios
  getSampleScenarios: async () => {
    const res = await apiClient.get('/logs/samples');
    return res.data;
  },

  // Clear all stored logs and alerts
  clearLogs: async () => {
    const res = await apiClient.delete('/logs');
    return res.data;
  }
};

export default api;
