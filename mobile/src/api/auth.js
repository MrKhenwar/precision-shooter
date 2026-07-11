// Auth API calls mapped to the Django endpoints.
import { api } from './client';
import { getDeviceId } from '../utils/device';

export const register = (payload) =>
  api.post('/auth/register/', payload).then((r) => r.data);

export const verifyOtp = (identifier, code) =>
  api.post('/auth/verify-otp/', { identifier, code }).then((r) => r.data);

export const resendOtp = (identifier) =>
  api.post('/auth/resend-otp/', { identifier }).then((r) => r.data);

export const login = async (identifier, password, recaptchaToken = '') => {
  const device_id = await getDeviceId();
  const { data } = await api.post('/auth/login/', {
    identifier,
    password,
    device_id,
    recaptcha_token: recaptchaToken,
  });
  return data; // { tokens, user, previous_device_signed_out }
};

export const fetchMe = () => api.get('/auth/me/').then((r) => r.data);
