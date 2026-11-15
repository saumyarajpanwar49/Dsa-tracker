
import api from '../lib/api';

// Smart Roadmap
export const getRoadmap = () =>
  api.get('/roadmap').then((response) => response.data);

export const generateRoadmap = () =>
  api.post('/roadmap/generate').then((response) => response.data);

export const updateRoadmapStatus = (id, status) =>
  api.patch(`/roadmap/${id}/status`, { status })
    .then((response) => response.data);

// Weakness Analysis
export const getWeaknessAnalysis = () =>
  api.get('/weakness').then((response) => response.data);

export const getTopicWeakness = () =>
  api.get('/weakness/topics').then((response) => response.data);

export const getPatternWeakness = () =>
  api.get('/weakness/patterns').then((response) => response.data);

// Smart Revision
export const getRevisionSchedule = () =>
  api.get('/revision').then((response) => response.data);

export const getRevisionHistory = () =>
  api.get('/revision/history').then((response) => response.data);

export const scheduleRevision = (questionId, dueAt) =>
  api.post(`/revision/${questionId}/schedule`, { dueAt })
    .then((response) => response.data);

export const completeRevision = (id) =>
  api.patch(`/revision/${id}/complete`)
    .then((response) => response.data);

// Progress Analytics
export const getAnalytics = () =>
  api.get('/analytics').then((response) => response.data);

export const getDailyGoals = () =>
  api.get('/analytics/goals').then((response) => response.data);

export const updateDailyGoal = (target) =>
  api.put('/analytics/goals', { target })
    .then((response) => response.data);
