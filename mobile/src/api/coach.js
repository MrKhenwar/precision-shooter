// Coach-side API calls.
import { api } from './client';

export const getCoachProfile = () =>
  api.get('/coaching/profile/').then((r) => r.data);

export const getPendingLinks = () =>
  api.get('/coaching/link-requests/').then((r) => r.data);

export const respondLink = (id, action /* 'approve' | 'reject' */) =>
  api.post(`/coaching/link-requests/${id}/${action}/`).then((r) => r.data);

export const getRoster = () => api.get('/coaching/roster/').then((r) => r.data);

export const setAthleteTier = (athleteId, tier) =>
  api.post(`/coaching/athletes/${athleteId}/tier/`, { tier }).then((r) => r.data);

// --- Batches & attendance ---
export const getBatches = () => api.get('/coaching/batches/').then((r) => r.data);

export const createBatch = (payload) =>
  api.post('/coaching/batches/', payload).then((r) => r.data);

export const deleteBatch = (id) => api.delete(`/coaching/batches/${id}/`);

export const getBatchMembers = (id) =>
  api.get(`/coaching/batches/${id}/members/`).then((r) => r.data);

export const addBatchMember = (id, athleteId) =>
  api.post(`/coaching/batches/${id}/members/`, { athlete_id: athleteId }).then((r) => r.data);

export const removeBatchMember = (id, athleteId) =>
  api.delete(`/coaching/batches/${id}/members/${athleteId}/`);

export const getBatchAttendance = (id, date) =>
  api.get(`/coaching/batches/${id}/attendance/`, { params: date ? { date } : {} }).then((r) => r.data);

export const markBatchAttendance = (id, entries, date) =>
  api.post(`/coaching/batches/${id}/attendance/`, { entries, ...(date ? { date } : {}) }).then((r) => r.data);

export const getAttendanceSummary = (period = 'week') =>
  api.get('/coaching/attendance/summary/', { params: { period } }).then((r) => r.data);

// All attendance records in a date range (for the calendar view).
export const getAttendanceRecords = (from, to) =>
  api.get('/coaching/attendance/records/', { params: { from, to } }).then((r) => r.data);
