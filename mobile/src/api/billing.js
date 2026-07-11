// Subscription/billing API (athlete).
import { api } from './client';

export const getSubscription = () =>
  api.get('/billing/subscription/').then((r) => r.data);

export const chooseAI = (aiOpted) =>
  api.post('/billing/subscription/choose-ai/', { ai_opted: aiOpted }).then((r) => r.data);
