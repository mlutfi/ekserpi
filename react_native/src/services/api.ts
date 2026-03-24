import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your server IP for physical devices
// For Android emulator: 10.0.2.2
// For physical device on same WiFi: use your machine's local IP
const BASE_URL = 'http://10.0.2.2:4001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // SecureStore not available (web), try memory
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - will be handled by AuthContext
      await SecureStore.deleteItemAsync('auth_token').catch(() => {});
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  verify2FA: (code: string, twoFactorToken: string) =>
    api.post('/auth/verify-2fa', { code, twoFactorToken }),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// ==================== PRODUCTS ====================
export const productAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/products', { params }),

  search: (q: string) =>
    api.get('/products/search', { params: { q } }),

  getByCategory: (categoryId?: string) =>
    api.get('/products/by-category', { params: categoryId ? { categoryId } : {} }),

  getById: (id: string) =>
    api.get(`/products/${id}`),
};

// ==================== CATEGORIES ====================
export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

// ==================== SALES ====================
export const saleAPI = {
  findAll: (params?: { page?: number; limit?: number; date?: string; status?: string }) =>
    api.get('/sales', { params }),

  create: (data: { locationId: string; customerName?: string; items: { productId: string; qty: number }[] }) =>
    api.post('/sales', data),

  getById: (id: string) =>
    api.get(`/sales/${id}`),

  payCash: (id: string, amount: number) =>
    api.post(`/sales/${id}/pay-cash`, { amount }),

  payQRISStatic: (id: string) =>
    api.post(`/sales/${id}/pay-qris-static`),

  payTransfer: (id: string, bankDetails: string) =>
    api.post(`/sales/${id}/pay-transfer`, { bankDetails }),

  paySplit: (id: string, payments: { method: string; amount: number; bankDetails?: string }[]) =>
    api.post(`/sales/${id}/pay-split`, { payments }),

  updateStatus: (id: string, status: string) =>
    api.put(`/sales/${id}/status`, { status }),

  getDailyReport: (params?: { date?: string }) =>
    api.get('/sales/daily-report', { params }),
};

// ==================== REPORTS ====================
export const reportAPI = {
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/summary', { params }),

  getChart: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    api.get('/reports/chart', { params }),

  getTopProducts: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get('/reports/top-products', { params }),

  getSalesDetail: (params?: { startDate?: string; endDate?: string; page?: number }) =>
    api.get('/reports/sales', { params }),
};

// ==================== LOCATIONS ====================
export const locationAPI = {
  getAll: () => api.get('/locations'),
};

// ==================== SETTINGS ====================
export const settingAPI = {
  getPosPayment: () => api.get('/settings/pos-payment'),
};

export default api;
