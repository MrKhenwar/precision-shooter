// Demo data mirroring the reference mockup exactly.
import { theme } from '../../theme';

export const AVATAR =
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80';
export const AVATAR_2 =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80';
export const AVATAR_3 =
  'https://images.unsplash.com/photo-1508341591423-4347099e1f19?auto=format&fit=crop&w=200&q=80';

export const HERO =
  'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&w=900&q=80';

export const PERFORMANCE_OVERVIEW = [
  { value: 85, color: theme.colors.success },
  { value: 78, color: theme.colors.primary },
  { value: 82, color: theme.colors.orange },
];

export const SCORE_TREND = [6.2, 6.9, 7.3, 7.1, 7.8, 8.0, 7.7, 8.3, 8.6, 8.4, 8.9, 9.0, 8.8, 9.4];
export const SCORE_TREND_X = ['17 Apr', '24 Apr', '1 May', '8 May', '15 May'];

export const SHOT_DISTRIBUTION = [
  { label: '10.5 & above', pct: '41.6%', color: theme.colors.success },
  { label: '10.0 - 10.4', pct: '28.3%', color: theme.colors.primary },
  { label: '9.0 - 9.9', pct: '19.8%', color: theme.colors.orange },
  { label: 'Below 9.0', pct: '10.3%', color: theme.colors.danger },
];

// Scattered shots for the target plot — clustered near centre.
export const SHOTS = (() => {
  const colors = [theme.colors.success, theme.colors.primary, theme.colors.orange, theme.colors.danger];
  const out = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 44; i++) {
    const spread = 0.14 + rnd() * 0.5;
    const ang = rnd() * Math.PI * 2;
    out.push({
      x: Math.cos(ang) * spread,
      y: Math.sin(ang) * spread,
      color: colors[spread < 0.25 ? 0 : spread < 0.38 ? 1 : spread < 0.5 ? 2 : 3],
    });
  }
  return out;
})();

export const TODAYS_PLAN = [
  { label: 'Warm Up & Breathing', meta: '20 min', done: true },
  { label: 'Dry Fire Practice', meta: '30 min', done: true },
  { label: 'Live Fire - 60 Shots', meta: '60 min', done: true },
  { label: 'Hold Stability Drill', meta: '20 min', done: false },
  { label: 'Cool Down & Stretching', meta: '15 min', done: false },
];

export const DAY_PLAN = [
  { label: 'Warm Up & Mobility', meta: '20 min', done: true },
  { label: 'Breathing Exercises', meta: '10 min', done: true },
  { label: 'Dry Fire Practice', meta: '30 min', done: true },
  { label: 'Live Fire - 60 Shots', meta: '60 min', done: true },
  { label: 'Match Simulation', meta: '30 min', done: false },
  { label: 'Cool Down', meta: '10 min', done: false },
];

export const WEEK_DAYS = [
  { d: 'Mon', n: 12 },
  { d: 'Tue', n: 13 },
  { d: 'Wed', n: 14 },
  { d: 'Thu', n: 15 },
  { d: 'Fri', n: 16 },
  { d: 'Sat', n: 17 },
  { d: 'Sun', n: 18 },
];

export const ATTENDANCE_LIST = [
  { name: 'Rohan Sharma', status: 'Present', avatar: AVATAR },
  { name: 'Arjun Patel', status: 'Present', avatar: AVATAR_2 },
  { name: 'Kabir Singh', status: 'Absent', avatar: AVATAR_3 },
];

export const BATCHES = [
  { name: 'Morning Batch', time: '06:00 AM - 08:00 AM', count: 18, color: theme.colors.primary, icon: 'people' },
  { name: 'Evening Batch', time: '04:00 PM - 06:00 PM', count: 20, color: theme.colors.success, icon: 'people' },
  { name: 'Weekend Batch', time: '08:00 AM - 10:00 AM', count: 12, color: theme.colors.danger, icon: 'people' },
];

export const RECENT_ACTIVITIES = [
  { name: 'Rohan Sharma', action: 'Attendance marked', time: '1m ago', avatar: AVATAR },
];

export const PROFILE_INFO = [
  { icon: 'calendar-outline', label: 'Date of Birth', value: '12 Mar 2006' },
  { icon: 'male-female-outline', label: 'Gender', value: 'Male' },
  { icon: 'ribbon-outline', label: 'Age Category', value: 'Junior' },
  { icon: 'location-outline', label: 'State / Club', value: 'Maharashtra Shooting Academy' },
  { icon: 'person-outline', label: 'Coach', value: 'Raj Malhotra' },
  { icon: 'radio-button-on-outline', label: 'Discipline', value: '10m Air Rifle' },
  { icon: 'hand-left-outline', label: 'Hand / Eye', value: 'Right Hand / Right Eye' },
  { icon: 'trophy-outline', label: 'Current Level', value: 'Marksman' },
  { icon: 'nutrition-outline', label: 'Diet Type', value: 'Non-Veg' },
  { icon: 'call-outline', label: 'Mobile', value: '+91 98765 43210' },
];
