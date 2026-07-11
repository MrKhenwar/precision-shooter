// Axios instance for the Precision Shooter API.
//
// IMPORTANT: a physical device cannot reach the host via "localhost".
// Set EXPO_PUBLIC_API_URL to your machine's LAN IP, e.g.:
//   EXPO_PUBLIC_API_URL=http://192.168.1.20:8000  npx expo start
import axios from 'axios';
import { Platform } from 'react-native';

import { K, secureDelete, secureGet, secureSet } from '../storage/secure';

const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:8000`;

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
});

// Attach access token on every request.
api.interceptors.request.use(async (config) => {
  const token = await secureGet(K.ACCESS);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Callback set by the AuthProvider so a forced logout can update React state.
let onForceLogout = null;
export const setForceLogout = (fn) => {
  onForceLogout = fn;
};

// Try a single token refresh on 401; if the device was unbound elsewhere
// (device_mismatch) or refresh fails, force a logout.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const code = error.response?.data?.code;

    if (code === 'device_mismatch') {
      await forceLogout('You were signed out because your account was used on another device.');
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) refreshing = doRefresh();
        const newAccess = await refreshing;
        refreshing = null;
        if (newAccess) {
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        }
      } catch (_) {
        refreshing = null;
      }
      await forceLogout('Your session expired. Please sign in again.');
    }
    return Promise.reject(error);
  }
);

async function doRefresh() {
  const refresh = await secureGet(K.REFRESH);
  if (!refresh) return null;
  const res = await axios.post(`${API_BASE}/api/auth/token/refresh/`, { refresh });
  const access = res.data.access;
  await secureSet(K.ACCESS, access);
  if (res.data.refresh) await secureSet(K.REFRESH, res.data.refresh);
  return access;
}

async function forceLogout(message) {
  await Promise.all([
    secureDelete(K.ACCESS),
    secureDelete(K.REFRESH),
    secureDelete(K.USER),
  ]);
  if (onForceLogout) onForceLogout(message);
}
