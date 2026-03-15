import axios from 'axios';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/+$/, '')
  : '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // Required for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.error;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage;
    }

    if (!error.response) {
      return 'Cannot connect to the server. Make sure the backend is running on http://localhost:5000.';
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

// Products API
export const productsApi = {
  getAll: async (params?: {
    search?: string;
    category_id?: number;
    min_price?: number;
    max_price?: number;
    material_type?: string;
    condition?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: Partial<{
    name: string;
    description: string;
    price: number;
    category_id: number;
    stock_quantity: number;
    sku: string;
    weight_kg: number;
    dimensions_cm: string;
    material_type: string;
    condition: string;
  }>) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id: number, data: Partial<{
    name: string;
    description: string;
    price: number;
    category_id: number;
    stock_quantity: number;
    sku: string;
    weight_kg: number;
    dimensions_cm: string;
    material_type: string;
    condition: string;
    is_active: boolean;
  }>) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  uploadImages: async (productId: number, images: { path: string; alt_text?: string }[]) => {
    const response = await api.post(`/products/${productId}/images`, { images });
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string; parent_category_id?: number }) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: number, data: { name?: string; description?: string; parent_category_id?: number }) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Cart API
export const cartApi = {
  get: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  addItem: async (productId: number, quantity: number = 1) => {
    const response = await api.post('/cart/items', { productId, quantity });
    return response.data;
  },

  updateItem: async (itemId: number, quantity: number) => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId: number) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  clear: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
};

// Orders API
export const ordersApi = {
  create: async (data: { shipping_address_id?: number; billing_address_id?: number; payment_method?: string }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/orders/me');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Admin endpoints
  getAll: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/orders/admin/all', { params });
    return response.data;
  },

  updateStatus: async (id: number, status: string, tracking_number?: string) => {
    const response = await api.put(`/orders/${id}/status`, { status, tracking_number });
    return response.data;
  },
};

// Admin API
export const adminApi = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async (params?: { search?: string; role?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUser: async (id: number) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, role: 'user' | 'admin') => {
    const response = await api.put(`/admin/users/${id}`, { role });
    return response.data;
  },

  getInventory: async (lowStockThreshold?: number) => {
    const response = await api.get('/admin/inventory', { params: { low_stock_threshold: lowStockThreshold } });
    return response.data;
  },
};

// Users API
export const usersApi = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: { firstName: string; lastName: string }) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  getAddresses: async () => {
    const response = await api.get('/users/addresses');
    return response.data;
  },

  addAddress: async (data: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state_province?: string;
    postal_code: string;
    country: string;
    is_default_shipping?: boolean;
    is_default_billing?: boolean;
  }) => {
    const response = await api.post('/users/addresses', data);
    return response.data;
  },

  updateAddress: async (id: number, data: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state_province?: string;
    postal_code: string;
    country: string;
    is_default_shipping?: boolean;
    is_default_billing?: boolean;
  }) => {
    const response = await api.put(`/users/addresses/${id}`, data);
    return response.data;
  },

  deleteAddress: async (id: number) => {
    const response = await api.delete(`/users/addresses/${id}`);
    return response.data;
  },
};

export default api;
