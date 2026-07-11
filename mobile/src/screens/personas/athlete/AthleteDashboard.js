import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getMyProfile, getMyAttendance } from '../../../api/athlete';
import { getMySessions } from '../../../api/training';
import { getMyFees } from '../../../api/academy';
import { getMyShootingRecords } from '../../../api/performance';
import { getSubscription } from '../../../api/billing';
import { TIER_LABELS } from '../../../components/Select';
import { DashboardShell } from '../Dashboard';
import { theme } from '../../../theme';

const TIER_KEYS = Object.keys(TIER_LABELS);

function attendanceColor(p) {
  if (p >= 85) return theme.colors.success;
  if (p >= 60) return theme.colors.warning;
  return theme.colors.danger;
}

export default function AthleteDashboard({ navigation }) {
  const [d, setD] = useState({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.allSettled([
        getMyProfile(),
        getMyAttendance(),
        getMySessions(),
        getMyFees(),
        getMyShootingRecords(),
        getSubscription(),
      ]).then((res) => {
        if (!active) return;
        const [profile, attendance, sessions, fees, shooting, sub] = res.map((r) =>
          r.status === 'fulfilled' ? r.value : null
        );
        setD({ profile, attendance, sessions, fees, shooting, sub });
      });
      return () => { active = false; };
    }, [])
  );

  const { profile, attendance, sessions, fees, shooting, sub } = d;
  const attPct = attendance?.attendance_pct ?? 0;
  const tierIdx = profile ? TIER_KEYS.indexOf(profile.current_tier) : 0;
  const nextSession = (sessions || []).filter((s) => !s.completed).sort((a, b) => a.date.localeCompare(b.date))[0];
  const incomplete = (sessions || []).filter((s) => !s.completed).length;
  const dues = (fees || []).filter((f) => f.status !== 'paid');
  const duesTotal = dues.reduce((t, f) => t + parseFloat(f.amount || 0), 0);
  const lastShoot = (shooting || [])[0];

  const rings = [
    { value: attPct, max: 100, color: attendanceColor(attPct), centerText: `${attPct}%`, label: 'Attendance' },
    {
      value: tierIdx + 1, max: TIER_KEYS.length, color: theme.colors.primary,
      centerText: profile ? (TIER_LABELS[profile.current_tier] || '—').split(' ')[0] : '—',
      label: 'Tier',
    },
    {
      value: sub?.trial_days_left ?? 0, max: 90, color: theme.colors.success,
      centerText: sub ? (sub.in_trial ? `${sub.trial_days_left}d` : `₹${sub.price}`) : '—',
      label: sub?.in_trial ? 'Trial left' : 'Plan',
    },
  ];

  const urgent = nextSession
    ? {
        kicker: 'NEXT TRAINING',
        title: nextSession.title,
        subtitle: nextSession.drills ? nextSession.drills.slice(0, 60) : 'Tap to view your sessions',
        badge: nextSession.date?.slice(5),
        accent: theme.colors.warning,
        onPress: () => navigation.navigate('Training'),
      }
    : null;

  const quickActions = [
    { label: '＋ Self Check-in', onPress: () => navigation.navigate('Attendance') },
    !profile?.is_coached
      ? { label: '🔗 Connect Coach', onPress: () => navigation.navigate('ConnectCoach'), color: theme.colors.success }
      : { label: '📓 Daily Diary', onPress: () => navigation.navigate('Diary'), color: theme.colors.success },
    { label: '🎯 Log Shots', onPress: () => navigation.navigate('ShootingRecord'), color: theme.colors.warning },
  ];

  return (
    <DashboardShell
      title="Your training"
      onProfile={() => navigation.navigate('Profile')}
      profileLabel="My Profile"
      rings={rings}
      urgent={urgent}
      quickActions={quickActions}
      modules={[
        {
          title: 'Attendance',
          desc: 'Self check-in & history',
          stat: `${attPct}%`,
          statColor: attendanceColor(attPct),
          accent: attendanceColor(attPct),
          onPress: () => navigation.navigate('Attendance'),
        },
        {
          title: 'My Training',
          desc: incomplete ? `${incomplete} session${incomplete > 1 ? 's' : ''} pending` : 'All caught up',
          stat: incomplete ? String(incomplete) : '✓',
          statColor: incomplete ? theme.colors.warning : theme.colors.success,
          accent: theme.colors.warning,
          onPress: () => navigation.navigate('Training'),
        },
        {
          title: 'Shooting Record',
          desc: lastShoot ? `Last: ${lastShoot.total_shots} shots` : 'Log shots, inner-tens, grouping',
          stat: lastShoot ? `${lastShoot.inner_ten_pct}%` : '—',
          statColor: theme.colors.primary,
          accent: theme.colors.primary,
          onPress: () => navigation.navigate('ShootingRecord'),
        },
        {
          title: 'My Fees',
          desc: duesTotal > 0 ? `₹${duesTotal} remaining · ${dues.length} due` : 'All clear',
          stat: duesTotal > 0 ? `₹${duesTotal}` : '✓',
          statColor: duesTotal > 0 ? theme.colors.danger : theme.colors.success,
          accent: duesTotal > 0 ? theme.colors.danger : theme.colors.success,
          onPress: () => navigation.navigate('MyFees'),
        },
        {
          title: 'Daily Diary',
          desc: 'Sleep, resting HR, stress, notes',
          onPress: () => navigation.navigate('Diary'),
        },
        {
          title: 'My Evaluations',
          desc: 'Coach assessments: shooting, S&C, overall',
          onPress: () => navigation.navigate('MyEvaluations'),
        },
        {
          title: 'My Plan',
          desc: sub ? sub.plan_label : 'Subscription & AI coaching',
          stat: sub ? (sub.price === 0 ? 'Free' : `₹${sub.price}`) : null,
          statColor: theme.colors.success,
          onPress: () => navigation.navigate('Plan'),
        },
        {
          title: 'Connect a Coach',
          desc: profile?.is_coached ? `Linked with ${profile.coach_name}` : 'Send a link request',
          stat: profile?.is_coached ? '✓' : null,
          statColor: theme.colors.success,
          onPress: () => navigation.navigate('ConnectCoach'),
        },
        {
          title: 'Parent Access',
          desc: 'Approve parent read-only access',
          onPress: () => navigation.navigate('ParentAccess'),
        },
      ]}
    />
  );
}
