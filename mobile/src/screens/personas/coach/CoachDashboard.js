import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  getAttendanceSummary,
  getCoachProfile,
  getPendingLinks,
  getRoster,
} from '../../../api/coach';
import { getFees, getInventory } from '../../../api/academy';
import { DashboardShell } from '../Dashboard';
import { theme } from '../../../theme';

function attendanceColor(p) {
  if (p >= 85) return theme.colors.success;
  if (p >= 60) return theme.colors.warning;
  return theme.colors.danger;
}

export default function CoachDashboard({ navigation }) {
  const [d, setD] = useState({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.allSettled([
        getCoachProfile(),
        getRoster(),
        getPendingLinks(),
        getAttendanceSummary('today'),
        getFees(),
        getInventory(),
      ]).then((res) => {
        if (!active) return;
        const [profile, roster, pending, summary, fees, inventory] = res.map((r) =>
          r.status === 'fulfilled' ? r.value : null
        );
        setD({ profile, roster, pending, summary, fees, inventory });
      });
      return () => { active = false; };
    }, [])
  );

  const { profile, roster, pending, summary, fees, inventory } = d;
  const active = profile?.active_athlete_count ?? roster?.length ?? 0;
  const pendingCount = pending?.length ?? 0;
  const attPct = summary?.total ? summary.attendance_pct : 0;
  const duesList = (fees || []).filter((f) => f.status !== 'paid');
  const duesTotal = duesList.reduce((t, f) => t + parseFloat(f.amount || 0), 0);
  const expiring = (inventory || []).filter((i) => i.expiry_alert).length;

  const rings = [
    { value: attPct, max: 100, color: attendanceColor(attPct), centerText: summary?.total ? `${attPct}%` : '—', label: "Today's Att." },
    { value: active, max: Math.max(active, 10), color: theme.colors.primary, centerText: String(active), label: 'Athletes' },
    { value: pendingCount, max: Math.max(pendingCount, 5), color: pendingCount ? theme.colors.warning : theme.colors.success, centerText: String(pendingCount), label: 'Requests' },
  ];

  const urgent = pendingCount
    ? {
        kicker: 'ACTION NEEDED',
        title: `${pendingCount} athlete request${pendingCount > 1 ? 's' : ''}`,
        subtitle: 'Tap to approve or reject',
        badge: 'Review',
        accent: theme.colors.warning,
        onPress: () => navigation.navigate('LinkRequests'),
      }
    : expiring
    ? {
        kicker: 'INVENTORY ALERT',
        title: `${expiring} cylinder${expiring > 1 ? 's' : ''} nearing expiry`,
        subtitle: 'Replace before the 10-year limit',
        badge: '⚠',
        accent: theme.colors.danger,
        onPress: () => navigation.navigate('Inventory'),
      }
    : null;

  const quickActions = [
    { label: '＋ Create Batch', onPress: () => navigation.navigate('Batches') },
    { label: '＋ Course Plan', onPress: () => navigation.navigate('CoursePlans'), color: theme.colors.success },
    { label: '＋ Raise Fee', onPress: () => navigation.navigate('Fees'), color: theme.colors.warning },
  ];

  return (
    <DashboardShell
      title="Command center"
      onProfile={() => navigation.navigate('Roster')}
      profileLabel="Roster"
      rings={rings}
      urgent={urgent}
      quickActions={quickActions}
      modules={[
        {
          title: 'Link Requests',
          desc: pendingCount ? `${pendingCount} awaiting approval` : 'No pending requests',
          stat: pendingCount ? String(pendingCount) : '✓',
          statColor: pendingCount ? theme.colors.warning : theme.colors.success,
          accent: pendingCount ? theme.colors.warning : theme.colors.success,
          onPress: () => navigation.navigate('LinkRequests'),
        },
        {
          title: 'Athlete Roster',
          desc: 'View athletes; tap to set tier & evaluate',
          stat: String(active),
          statColor: theme.colors.primary,
          accent: theme.colors.primary,
          onPress: () => navigation.navigate('Roster'),
        },
        {
          title: 'Batches & Attendance',
          desc: summary?.total ? `Today: ${attPct}% present` : 'Create batches, mark attendance',
          stat: summary?.total ? `${attPct}%` : '—',
          statColor: attendanceColor(attPct),
          accent: attendanceColor(attPct),
          onPress: () => navigation.navigate('Batches'),
        },
        {
          title: 'Fees',
          desc: duesTotal > 0 ? `₹${duesTotal} outstanding · ${duesList.length} due` : 'All fees cleared',
          stat: duesTotal > 0 ? `₹${duesTotal}` : '✓',
          statColor: duesTotal > 0 ? theme.colors.danger : theme.colors.success,
          accent: duesTotal > 0 ? theme.colors.danger : theme.colors.success,
          onPress: () => navigation.navigate('Fees'),
        },
        {
          title: 'Inventory',
          desc: expiring ? `${expiring} cylinder alert${expiring > 1 ? 's' : ''}` : 'Kit & cylinder tracking',
          stat: expiring ? '⚠' : null,
          statColor: theme.colors.danger,
          accent: expiring ? theme.colors.danger : theme.colors.border,
          onPress: () => navigation.navigate('Inventory'),
        },
        {
          title: 'Course Plans',
          desc: 'Macro / meso cycles, themes and goals',
          onPress: () => navigation.navigate('CoursePlans'),
        },
      ]}
    />
  );
}
