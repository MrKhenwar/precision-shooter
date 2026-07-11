// Training plans API.
import { api } from './client';

// Coach
export const getCoursePlans = () =>
  api.get('/training/course-plans/').then((r) => r.data);

export const createCoursePlan = (payload) =>
  api.post('/training/course-plans/', payload).then((r) => r.data);

export const deleteCoursePlan = (id) => api.delete(`/training/course-plans/${id}/`);

export const getSessions = (athleteId) =>
  api.get('/training/sessions/', { params: athleteId ? { athlete: athleteId } : {} }).then((r) => r.data);

export const createSession = (payload) =>
  api.post('/training/sessions/', payload).then((r) => r.data);

// Athlete
export const getMySessions = () =>
  api.get('/training/my-sessions/').then((r) => r.data);

export const completeSession = (id, completed) =>
  api.post(`/training/my-sessions/${id}/complete/`, { completed }).then((r) => r.data);
