import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const bookApi = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  getChapters: (id) => api.get(`/books/${id}/chapters`),
  getChapter: (bookId, chapterId) => api.get(`/books/${bookId}/chapters/${chapterId}`),
  search: (query) => api.get('/search', { params: query }),
};

export const gutenbergApi = {
  search: (q, page = 1) => api.get('/gutenberg/search', { params: { q, page } }),
};

export const userApi = {
  requestSignupOtp: (data) => api.post('/auth/signup/request-otp', data),
  verifySignupOtp: (data) => api.post('/auth/signup/verify', data),
  requestPasswordResetOtp: (data) => api.post('/auth/forgot-password/request-otp', data),
  resetPassword: (data) => api.post('/auth/forgot-password/reset', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};


export const categoryApi = {
  getCategories: () => api.get('/categories'),
  getCategoryBooks: (id, params) => api.get(`/categories/${id}/books`, { params }),
};

export const adminApi = {
  login: (credentials) => api.post('/admin/login', credentials),
  
  // Categories
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Books (using FormData for coverImage upload capability)
  createBook: (formData) => api.post('/admin/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateBook: (id, formData) => api.put(`/admin/books/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteBook: (id) => api.delete(`/admin/books/${id}`),

  // Chapters
  createChapter: (bookId, data) => api.post(`/admin/books/${bookId}/chapters`, data),
  updateChapter: (chapterId, data) => api.put(`/admin/chapters/${chapterId}`, data),
  deleteChapter: (chapterId) => api.delete(`/admin/chapters/${chapterId}`),

  // Gutenberg import
  importGutenbergBook: (gutenbergId) => api.post('/admin/gutenberg/import', { gutenbergId }),
  reimportGutenbergBook: (bookId) => api.put('/admin/gutenberg/reimport', { bookId }),
};

export default api;
