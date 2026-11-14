import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Authentication
export const registerUser = (data) =>
  api.post('/auth/register', data).then((r) => r.data);

export const loginUser = (data) =>
  api.post('/auth/login', data).then((r) => r.data);

export const logoutUser = () =>
  api.post('/auth/logout').then((r) => r.data);

export const getCurrentUser = () =>
  api.get('/auth/me').then((r) => r.data);

// Problems
export const getProblems = (params) =>
  api.get('/problems', { params }).then((r) => r.data);

export const getStats = () =>
  api.get('/problems/stats').then((r) => r.data);

export const createProblem = (data) =>
  api.post('/problems', data).then((r) => r.data);

export const updateProblem = (id, data) =>
  api.put(`/problems/${id}`, data).then((r) => r.data);

export const deleteProblem = (id) =>
  api.delete(`/problems/${id}`).then((r) => r.data);

// Revision notes
export const addRevisionNote = (problemId, note) =>
  api.post(`/problems/${problemId}/notes`, { note }).then((r) => r.data);

export const deleteRevisionNote = (problemId, noteId) =>
  api.delete(`/problems/${problemId}/notes/${noteId}`).then((r) => r.data);

// Topics
export const getTopics = () =>
  api.get('/topics').then((r) => r.data);

export const createTopic = (name) =>
  api.post('/topics', { name }).then((r) => r.data);

export const deleteTopic = (name) =>
  api.delete(`/topics/${encodeURIComponent(name)}`).then((r) => r.data);

// Reminders
export const triggerReminders = () =>
  api.post('/reminders/trigger').then((r) => r.data);

// Admin
export const getAdminDashboard = () =>
  api.get('/admin/dashboard').then((r) => r.data);

export const getAdminUsers = () =>
  api.get('/admin/users').then((r) => r.data);

export const getAdminUser = (id) =>
  api.get(`/admin/users/${id}`).then((r) => r.data);

export const updateUserStatus = (id, isActive) =>
  api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data);

export const updateUserRole = (id, role) =>
  api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data);

export default api;
