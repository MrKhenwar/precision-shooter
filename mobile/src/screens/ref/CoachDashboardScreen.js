// Coach dashboard — live KPIs (athletes, today's attendance, pending fees,
// link requests), quick actions and a recent-activity feed. Reference 3.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconTile, Loading } from '../../components/kit';
import { MenuSheet } from '../../components/MenuSheet';
import { useAuth } from '../../store/AuthContext';
import { useFetch } from './useFetch';
import { fmtDay, greeting, money, timeAgo } from './labels';
import { getAttendanceSummary, getCoachProfile, getPendingLinks, getRoster } from '../../api/coach';
import { getFees } from '../../api/academy';
import { theme } from '../../theme';

const ACTIONS = [
  { label: 'Attendance', icon: 'checkmark-done', color: theme.colors.success, to: 'Attendance' },
  { label: 'Athletes', icon: 'people', color: theme.colors.primary, tab: 'Athletes' },
  { label: 'Batches', icon: 'grid', color: theme.colors.orange, to: 'Batches' },
  { label: 'Training Plan', icon: 'clipboard', color: theme.colors.purple, tab: 'Training' },
  { label: 'Fees', icon: 'card', color: theme.colors.gold, to: 'Fees' },
  { label: 'Inventory', icon: 'cube', color: theme.colors.cyan, to: 'Inventory' },
];

export default function CoachDashboardScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data, loading } = useFetch({
    profile: getCoachProfile,
    roster: getRoster,
    summary: () => getAttendanceSummary('today'),
    fees: () => getFees(),
    pending: getPendingLinks,
  });

  const { profile, roster, summary, fees, pending } = data;
  const totalAthletes = profile?.active_athlete_count ?? roster?.length ?? 0;
  const attPct = summary?.total ? summary.attendance_pct : 0;
  const present = summary?.present ?? 0;
  const total = summary?.total ?? 0;
  const dues = (fees || []).filter((f) => f.status !== 'paid');
  const duesTotal = dues.reduce((t, f) => t + parseFloat(f.amount || 0), 0);
  const pendingCount = pending?.length ?? 0;

  const STATS = [
    { label: 'Total Athletes', value: String(totalAthletes), sub: profile ? 'Active roster' : '—', subColor: theme.colors.success },
    { label: "Today's Attendance", value: total ? `${attPct}%` : '—', sub: total ? `${present} / ${total} present` : 'No records today', subColor: theme.colors.textMuted, subStrong: total ? String(present) : null },
    { label: 'Pending Fees', value: money(duesTotal), valueColor: duesTotal ? theme.colors.danger : theme.colors.text, sub: `${dues.length} athlete${dues.length === 1 ? '' : 's'}`, subColor: theme.colors.textMuted },
    { label: 'Link Requests', value: String(pendingCount), sub: pendingCount ? 'Awaiting approval' : 'All clear', subColor: pendingCount ? theme.colors.warning : theme.colors.success, dot: true },
  ];

  const go = (a) => {
    if (a.tab) navigation.navigate(a.tab);
    else if (a.to) navigation.navigate(a.to);
  };

  const firstName = (user?.full_name || user?.first_name || 'Coach').split(' ')[0];

  const menuItems = [
    { icon: 'people', label: 'Athletes', color: theme.colors.primary, onPress: () => navigation.navigate('Athletes') },
    { icon: 'person-add', label: 'Link Requests', color: theme.colors.cyan, onPress: () => navigation.navigate('LinkRequests') },
    { icon: 'shield-checkmark', label: 'Attendance', color: theme.colors.success, onPress: () => navigation.navigate('Attendance') },
    { icon: 'grid', label: 'Batches', color: theme.colors.orange, onPress: () => navigation.navigate('Batches') },
    { icon: 'clipboard', label: 'Training Plan', color: theme.colors.purple, onPress: () => navigation.navigate('Training') },
    { icon: 'albums', label: 'Course Plans', color: theme.colors.pink, onPress: () => navigation.navigate('CoursePlans') },
    { icon: 'card', label: 'Fees', color: theme.colors.gold, onPress: () => navigation.navigate('Fees') },
    { icon: 'cube', label: 'Inventory', color: theme.colors.cyan, onPress: () => navigation.navigate('Inventory') },
    { icon: 'log-out-outline', label: 'Sign Out', color: theme.colors.danger, danger: true, onPress: signOut },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Precision Shooter"
        subtitle={user?.full_name ? `Coach ${firstName}` : 'Coach'}
        items={menuItems}
      />
      <View style={styles.header}>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={10}>
          <Ionicons name="menu" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Dashboard (Coach)</Text>
        <View>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          {pendingCount ? <View style={styles.bellDot} /> : null}
        </View>
      </View>

      {loading ? (
        <Loading label="Loading your dashboard…" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greet}>{greeting()}, Coach {firstName}</Text>
              <Text style={styles.greetSub}>Here's what's happening today</Text>
            </View>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>{fmtDay(new Date())}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Ionicons name="chevron-down" size={13} color={theme.colors.textFaint} />
                </View>
                <Text style={[styles.statValue, s.valueColor && { color: s.valueColor }]}>{s.value}</Text>
                <View style={styles.statSubRow}>
                  {s.dot ? <View style={[styles.dot, { backgroundColor: s.subColor }]} /> : null}
                  <Text style={[styles.statSub, { color: s.subColor }]}>
                    {s.subStrong ? <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{s.subStrong} </Text> : null}
                    {s.subStrong ? s.sub.replace(s.subStrong, '').trim() : s.sub}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.section}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {ACTIONS.map((a) => (
              <Pressable key={a.label} style={styles.action} onPress={() => go(a)}>
                <IconTile icon={a.icon} color={a.color} size={52} iconSize={24} />
                <Text style={styles.actionLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>Recent Activities</Text>
          <View style={styles.card}>
            {pendingCount ? (
              pending.slice(0, 5).map((p) => (
                <View key={p.id} style={styles.activityRow}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="person-add" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.activityName}>{p.athlete_name}</Text>
                    <Text style={styles.activityAction}>Requested to join · {p.athlete_discipline || 'Athlete'}</Text>
                  </View>
                  <Text style={styles.activityTime}>{timeAgo(p.requested_at)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No new activity. You're all caught up.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1.5) },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  bellDot: { position: 'absolute', top: 0, right: 0, width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.danger, borderWidth: 1.5, borderColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(3) },

  greetRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing(1) },
  greet: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  greetSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 3 },
  datePill: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  dateText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: theme.spacing(2) },
  statCard: { width: '48.5%', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 12 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  statValue: { color: theme.colors.text, fontSize: 26, fontWeight: '800', marginTop: 8 },
  statSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statSub: { fontSize: 12, fontWeight: '500' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },

  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(1.5), marginBottom: theme.spacing(1.5) },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  action: { width: '25%', alignItems: 'center', marginBottom: theme.spacing(2) },
  actionLabel: { color: theme.colors.textMuted, fontSize: 11, marginTop: 7, textAlign: 'center' },

  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 14 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  activityIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  activityName: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  activityAction: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  activityTime: { color: theme.colors.textFaint, fontSize: 12 },
  emptyText: { color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
});
