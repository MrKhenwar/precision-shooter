// Enum → display maps and small formatters used to render dynamic backend
// data on the reference screens.

export const GENDER = { male: 'Male', female: 'Female', other: 'Other' };
export const HAND = { RH: 'Right Hand', LH: 'Left Hand' };
export const EYE = { right: 'Right', left: 'Left', cross: 'Cross-Dominant' };
export const DISCIPLINE = { air_rifle: '10m Air Rifle', air_pistol: '10m Air Pistol' };
export const DIET = { veg: 'Vegetarian', non_veg: 'Non-Veg', vegan: 'Vegan', eggetarian: 'Eggetarian' };
export const TIER = {
  rookie: 'Rookie', novice: 'Novice', marksman: 'Marksman', sharpshooter: 'Sharpshooter',
  district: 'District', state: 'State Qualified', zone: 'Zone Qualified',
  national: 'National Qualified', trial: 'Trial Qualified', national_team: 'National Team',
};

export const label = (map, key) => (key ? map[key] || cap(key) : '—');
export const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

export function money(n) {
  const v = Number(n || 0);
  return '₹' + v.toLocaleString('en-IN');
}

// "12 Mar 2006" style.
export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// "16 May 2025"
export function fmtDay(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const s = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// Diary 0–10 helpers.
export function sleepLabel(q) {
  if (q >= 8) return { note: 'Excellent', color: 'success' };
  if (q >= 6) return { note: 'Good', color: 'success' };
  if (q >= 4) return { note: 'Fair', color: 'warning' };
  return { note: 'Poor', color: 'danger' };
}
export function stressLabel(s) {
  if (s <= 3) return { text: 'Low', color: 'success' };
  if (s <= 6) return { text: 'Medium', color: 'warning' };
  return { text: 'High', color: 'danger' };
}
