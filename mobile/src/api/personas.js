// Parent & Expert persona APIs.
import { api } from './client';

// Parent
export const requestChildLink = (athleteMobile) =>
  api.post('/athletes/parent/link-request/', { athlete_mobile: athleteMobile }).then((r) => r.data);

export const getMyChildren = () =>
  api.get('/athletes/parent/children/').then((r) => r.data);

export const getChildDetail = (athleteId) =>
  api.get(`/athletes/parent/children/${athleteId}/`).then((r) => r.data);

// Athlete approves parent access
export const getParentRequests = () =>
  api.get('/athletes/parent-requests/').then((r) => r.data);

export const respondParentRequest = (id, action) =>
  api.post(`/athletes/parent-requests/${id}/${action}/`).then((r) => r.data);

// Expert
export const getExpertProfile = () =>
  api.get('/coaching/expert/profile/').then((r) => r.data);

export const updateExpertProfile = (patch) =>
  api.patch('/coaching/expert/profile/', patch).then((r) => r.data);

export const getExpertDirectory = () =>
  api.get('/coaching/experts/').then((r) => r.data);
