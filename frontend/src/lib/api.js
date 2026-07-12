import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Problems
export const getProblems = (params) => api.get('/problems', { params }).then((r) => r.data);
export const getStats = () => api.get('/problems/stats').then((r) => r.data);
export const createProblem = (data) => api.post('/problems', data).then((r) => r.data);
export const updateProblem = (id, data) => api.put(`/problems/${id}`, data).then((r) => r.data);
export const deleteProblem = (id) => api.delete(`/problems/${id}`).then((r) => r.data);

// Revision Notes
export const addRevisionNote = (problemId, note) =>
  api.post(`/problems/${problemId}/notes`, { note }).then((r) => r.data);
export const deleteRevisionNote = (problemId, noteId) =>
  api.delete(`/problems/${problemId}/notes/${noteId}`).then((r) => r.data);

// Topics
export const getTopics = () => api.get('/topics').then((r) => r.data);
export const createTopic = (name) => api.post('/topics', { name }).then((r) => r.data);
export const deleteTopic = (name) =>
  api.delete(`/topics/${encodeURIComponent(name)}`).then((r) => r.data);

// Reminders
export const triggerReminders = () => api.post('/reminders/trigger').then((r) => r.data);

export default api;
