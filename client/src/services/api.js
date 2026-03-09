import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
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
};

export default api;
