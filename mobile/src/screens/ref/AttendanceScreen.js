// Attendance — a month calendar with per-day dots; tapping a date lists the
// athletes present that day with their discipline/level, and tapping an athlete
// opens their profile. Reference screen 6 (calendar variant).
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, Header, Loading } from '../../components/kit';
import { Calendar } from '../../components/Calendar';
import { DISCIPLINE, TIER, fmtDay, label } from './labels';
import { getAttendanceRecords, getRoster } from '../../api/coach';
import { theme } from '../../theme';

const iso = (d) => d.toISOString().slice(0, 10);
const isPresent = (s) => s === 'present' || s === 'late';

export default function AttendanceScreen({ navigation }) {
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => iso(new Date()));
  const [state, setState] = useState({ loading: true, records: [], roster: [] });

  const load = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    const y = month.getFullYear();
    const m = month.getMonth();
    const from = iso(new Date(y, m, 1));
    const to = iso(new Date(y, m + 1, 0));
    Promise.all([
      getAttendanceRecords(from, to).catch(() => []),
      getRoster().catch(() => []),
    ]).then(([records, roster]) => {
      if (active) setState({ loading: false, records: records || [], roster: roster || [] });
    });
    return () => { active = false; };
  }, [month]);

  useFocusEffect(load);

  const { loading, records, roster } = state;
  const rosterById = useMemo(() => {
    const map = {};
    roster.forEach((r) => { map[r.id] = r; });
    return map;
  }, [roster]);

  // marks: date -> colour (green if anyone present, else red).
  const marks = useMemo(() => {
    const byDate = {};
    records.forEach((r) => {
      byDate[r.date] = byDate[r.date] || { present: 0, total: 0 };
      byDate[r.date].total += 1;
      if (isPresent(r.status)) byDate[r.date].present += 1;
    });
    const out = {};
    Object.entries(byDate).forEach(([d, v]) => {
      out[d] = v.present > 0 ? theme.colors.success : theme.colors.danger;
    });
    return out;
  }, [records]);

  const dayRecords = records.filter((r) => r.date === selected);
  const present = dayRecords.filter((r) => isPresent(r.status));
  const absent = dayRecords.filter((r) => !isPresent(r.status));
  const pct = dayRecords.length ? Math.round((100 * present.length) / dayRecords.length) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Attendance" left={null} right="calendar-outline" />
      {loading ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Calendar
            month={month}
            marks={marks}
            selected={selected}
            onSelect={setSelected}
            onPrev={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            onNext={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          />

          {/* Selected-day summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>{present.length}</Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={[styles.summaryCard, { marginHorizontal: 10 }]}>
              <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>{absent.length}</Text>
              <Text style={styles.summaryLabel}>Absent</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{pct}%</Text>
              <Text style={styles.summaryLabel}>Attendance %</Text>
            </View>
          </View>

          <Text style={styles.section}>{fmtDay(selected)}</Text>

          {dayRecords.length === 0 ? (
            <EmptyState icon="calendar-outline" title="No attendance" sub="No records marked for this day." />
          ) : (
            present.concat(absent).map((r) => {
              const info = rosterById[r.athlete];
              const ok = isPresent(r.status);
              return (
                <Pressable
                  key={r.id}
                  style={styles.row}
                  onPress={() => navigation.navigate('AthleteProfile', {
                    athleteId: r.athlete,
                    name: r.athlete_name,
                    discipline: info?.discipline,
                    tier: info?.current_tier,
                  })}
                >
                  <View style={[styles.avatar, { backgroundColor: ok ? theme.colors.successDim : theme.colors.dangerDim }]}>
                    <Text style={[styles.avatarText, { color: ok ? theme.colors.success : theme.colors.danger }]}>{initials(r.athlete_name)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.name}>{r.athlete_name}</Text>
                    <Text style={styles.sub}>
                      {label(DISCIPLINE, info?.discipline)}{info?.current_tier ? ` · ${label(TIER, info.current_tier)}` : ''}
                    </Text>
                  </View>
                  <Badge label={cap(r.status)} color={ok ? theme.colors.success : theme.colors.danger} />
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} style={{ marginLeft: 6 }} />
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(4) },
  summaryRow: { flexDirection: 'row', marginTop: theme.spacing(2) },
  summaryCard: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 16 },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { color: theme.colors.textMuted, fontSize: 12, marginTop: 6 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(2.5), marginBottom: theme.spacing(1.5) },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 15 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
});
