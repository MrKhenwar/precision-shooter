// Secure storage wrapper. On native this maps to iOS Keychain /
// Android EncryptedSharedPreferences (the BFR offline-cache requirement);
// on web it falls back to localStorage since SecureStore is unavailable.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const webStore = {
  getItem: (k) => Promise.resolve(globalThis.localStorage?.getItem(k) ?? null),
  setItem: (k, v) => Promise.resolve(globalThis.localStorage?.setItem(k, v)),
  removeItem: (k) => Promise.resolve(globalThis.localStorage?.removeItem(k)),
};

const isWeb = Platform.OS === 'web';

export const secureGet = (key) =>
  isWeb ? webStore.getItem(key) : SecureStore.getItemAsync(key);

export const secureSet = (key, value) =>
  isWeb ? webStore.setItem(key, value) : SecureStore.setItemAsync(key, value);

export const secureDelete = (key) =>
  isWeb ? webStore.removeItem(key) : SecureStore.deleteItemAsync(key);

// Keys
export const K = {
  ACCESS: 'ps_access_token',
  REFRESH: 'ps_refresh_token',
  USER: 'ps_user',
  DEVICE_ID: 'ps_device_id',
};
