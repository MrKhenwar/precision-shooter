// Performance API: evaluations, shooting records, diary.
import { api } from './client';

// Athlete (own)
export const getMyShootingRecords = () =>
  api.get('/performance/shooting-records/').then((r) => r.data);

export const addShootingRecord = (payload) =>
  api.post('/performance/shooting-records/', payload).then((r) => r.data);

export const getMyDiary = () => api.get('/performance/diary/').then((r) => r.data);

export const addDiaryEntry = (payload) =>
  api.post('/performance/diary/', payload).then((r) => r.data);

export const getMyEvaluations = () =>
  api.get('/performance/evaluations/').then((r) => r.data);

// Coach
export const createEvaluation = (payload) =>
  api.post('/performance/evaluations/create/', payload).then((r) => r.data);

export const getAthleteEvaluations = (athleteId) =>
  api.get(`/performance/athletes/${athleteId}/evaluations/`).then((r) => r.data);

export const getAthleteShootingRecords = (athleteId) =>
  api.get(`/performance/athletes/${athleteId}/shooting-records/`).then((r) => r.data);

export const getAthleteDiary = (athleteId) =>
  api.get(`/performance/athletes/${athleteId}/diary/`).then((r) => r.data);
