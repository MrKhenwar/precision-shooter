// Fees & inventory API.
import { api } from './client';

// Fees (coach)
export const getFees = (status) =>
  api.get('/academy/fees/', { params: status ? { status } : {} }).then((r) => r.data);

export const createFee = (payload) =>
  api.post('/academy/fees/', payload).then((r) => r.data);

export const updateFee = (id, patch) =>
  api.patch(`/academy/fees/${id}/`, patch).then((r) => r.data);

// Fees (athlete)
export const getMyFees = () => api.get('/academy/my-fees/').then((r) => r.data);

export const payMyFee = (id) =>
  api.post(`/academy/my-fees/${id}/pay/`).then((r) => r.data);

// Inventory (coach)
export const getInventory = (category) =>
  api.get('/academy/inventory/', { params: category ? { category } : {} }).then((r) => r.data);

export const createInventoryItem = (payload) =>
  api.post('/academy/inventory/', payload).then((r) => r.data);

export const updateInventoryItem = (id, patch) =>
  api.patch(`/academy/inventory/${id}/`, patch).then((r) => r.data);

export const deleteInventoryItem = (id) => api.delete(`/academy/inventory/${id}/`);

export const getExpiringCylinders = () =>
  api.get('/academy/inventory/expiring/').then((r) => r.data);
