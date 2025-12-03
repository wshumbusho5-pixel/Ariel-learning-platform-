import api from './api';

export const adminAPI = {
  // Dashboard stats
  getStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  // User management
  getUsers: async (skip: number = 0, limit: number = 50) => {
    const response = await api.get(`/api/admin/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getUserDetails: async (userId: string) => {
    const response = await api.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, data: { role?: string; is_active?: boolean }) => {
    const response = await api.patch(`/api/admin/users/${userId}`, data);
    return response.data;
  },

  // Usage metrics
  getUsageMetrics: async (days: number = 7) => {
    const response = await api.get(`/api/admin/usage?days=${days}`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/api/admin/health');
    return response.data;
  },
};
