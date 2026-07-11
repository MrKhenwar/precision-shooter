// Stable per-install device id, used to enforce the backend's
// "1 User = 1 Active Device" rule. Generated once and persisted securely.
import { K, secureGet, secureSet } from '../storage/secure';

function randomId() {
  return 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getDeviceId() {
  let id = await secureGet(K.DEVICE_ID);
  if (!id) {
    id = randomId();
    await secureSet(K.DEVICE_ID, id);
  }
  return id;
}
