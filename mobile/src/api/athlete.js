// Athlete-side API calls.
import { api } from './client';

export const getMyProfile = () =>
  api.get('/athletes/profile/').then((r) => r.data);

export const updateMyProfile = (patch) =>
  api.patch('/athletes/profile/', patch).then((r) => r.data);

export const listClubs = () => api.get('/athletes/clubs/').then((r) => r.data);

export const requestCoachLink = (coachMobile) =>
  api.post('/athletes/link-request/', { coach_mobile: coachMobile }).then((r) => r.data);

export const listMyLinkRequests = () =>
  api.get('/athletes/link-requests/').then((r) => r.data);

// --- Attendance ---
export const getMyAttendance = () =>
  api.get('/athletes/attendance/').then((r) => r.data);

export const getMyBatches = () => api.get('/athletes/batches/').then((r) => r.data);

export const selfCheckIn = (batchId, method = 'self') =>
  api
    .post('/athletes/attendance/self/', { ...(batchId ? { batch_id: batchId } : {}), method })
    .then((r) => r.data);
