// Training plan — combines batch schedules (which weekdays each batch runs) with
// assigned training sessions. Shows the current week, the selected day's batches
// + trainings, and upcoming batch days. Reference screen 8.
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Header, IconTile, Loading } from '../../components/kit';
import { useAuth } from '../../store/AuthContext';
import { getBatches } from '../../api/coach';
import { getMyBatches } from '../../api/athlete';
import { getMySessions, getSessions, completeSession } from '../../api/training';
import { theme } from '../../theme';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DOW_ABBR = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // by Date.getDay()
const iso = (d) => d.toISOString().slice(0, 10);

function weekOf(base) {
  const d = new Date(base);
  const dow = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);
  return DAY_NAMES.map((name, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return { name, n: day.getDate(), iso: iso(day) };
  });
}

function batchDays(b) {
  return String(b.days || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}
function batchRunsOn(b, dateIso) {
  const abbr = DOW_ABBR[new Date(dateIso).getDay()];
  return batchDays(b).includes(abbr);
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const h12 = ((hr + 11) % 12) + 1;
  return `${String(h12).padStart(2, '0')}:${m || '00'} ${ampm}`;
}
function batchTime(b) {
  return b.start_time ? `${fmtTime(b.start_time)} - ${fmtTime(b.end_time)}` : 'All day';
}

export default function TrainingPlanScreen({ navigation }) {
  const { user } = useAuth();
  const isAthlete = user?.persona !== 'coach';
  const week = useMemo(() => weekOf(new Date()), []);
  const [selected, setSelected] = useState(() => iso(new Date()));
  const [state, setState] = useState({ loading: true, sessions: [], batches: [] });

  const load = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    Promise.all([
      (isAthlete ? getMySessions() : getSessions()).catch(() => []),
      (isAthlete ? getMyBatches() : getBatches()).catch(() => []),
    ]).then(([sessions, batches]) => {
      if (active) setState({ loading: false, sessions: sessions || [], batches: batches || [] });
    });
    return () => { active = false; };
  }, [isAthlete]);

  useFocusEffect(load);

  const { loading, sessions, batches } = state;
  const daySessions = sessions.filter((s) => s.date === selected);
  const dayBatches = batches.filter((b) => batchRunsOn(b, selected));
  const done = daySessions.filter((s) => s.completed).length;
  const selDate = new Date(selected);
  const range = `${week[0].n} ${monShort(week[0].iso)} - ${week[6].n} ${monShort(week[6].iso)} ${selDate.getFullYear()}`;

  // Upcoming batch days over the next two weeks.
  const upcoming = useMemo(() => {
    const out = [];
    for (let i = 1; i <= 14 && out.length < 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const di = iso(d);
      batches.filter((b) => batchRunsOn(b, di)).forEach((b) => out.push({ batch: b, date: di, day: d }));
    }
    return out;
  }, [batches]);

  async function toggle(s) {
    if (!isAthlete) return;
    try {
      await completeSession(s.id, !s.completed);
      setState((st) => ({ ...st, sessions: st.sessions.map((x) => (x.id === s.id ? { ...x, completed: !x.completed } : x)) }));
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Training Plan" left={null} right="calendar-outline" />
      {loading ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.weekNav}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.textMuted} />
            <Text style={styles.weekLabel}>{range}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </View>

          <View style={styles.dayStrip}>
            {week.map((d) => {
              const on = d.iso === selected;
              const has = sessions.some((s) => s.date === d.iso) || batches.some((b) => batchRunsOn(b, d.iso));
              return (
                <Pressable key={d.iso} onPress={() => setSelected(d.iso)} style={[styles.day, on && styles.dayActive]}>
                  <Text style={[styles.dayName, on && styles.dayTextActive]}>{d.name}</Text>
                  <Text style={[styles.dayNum, on && styles.dayTextActive]}>{d.n}</Text>
                  {has && !on ? <View style={styles.dayDot} /> : null}
                </Pressable>
              );
            })}
          </View>

          {/* Batches scheduled this day */}
          {dayBatches.length > 0 && (
            <>
              <Text style={styles.section}>Batches on {DAY_NAMES[(selDate.getDay() + 6) % 7]}</Text>
              {dayBatches.map((b) => (
                <View key={b.id} style={styles.batchCard}>
                  <IconTile icon="people" color={theme.colors.primary} size={46} iconSize={22} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.batchName}>{b.name}</Text>
                    <Text style={styles.batchTime}>{batchTime(b)} · {b.member_count ?? 0} athletes</Text>
                  </View>
                  <Ionicons name="calendar" size={18} color={theme.colors.textFaint} />
                </View>
              ))}
            </>
          )}

          {/* Training sessions this day */}
          <View style={styles.planHead}>
            <Text style={styles.planTitle}>Day Plan - {selDate.getDate()} {monShort(selected)}</Text>
            {daySessions.length ? <Text style={styles.completed}>{done} / {daySessions.length} Completed</Text> : null}
          </View>
          {daySessions.length === 0 ? (
            <View style={styles.card}><EmptyState icon="clipboard-outline" title="No training" sub={dayBatches.length ? 'Batch scheduled, no drills assigned yet.' : 'Nothing planned for this day.'} /></View>
          ) : (
            <View style={styles.card}>
              {daySessions.map((s, i) => (
                <Pressable key={s.id} onPress={() => toggle(s)} style={[styles.row, i !== daySessions.length - 1 && styles.rowBorder]}>
                  <Ionicons name={s.completed ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={s.completed ? theme.colors.success : theme.colors.textFaint} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.label, !s.completed && { color: theme.colors.textMuted }]}>{s.title}</Text>
                    {s.drills ? <Text style={styles.drills} numberOfLines={1}>{s.drills}</Text> : null}
                    {!isAthlete && s.athlete_name ? <Text style={styles.drills}>{s.athlete_name}</Text> : null}
                  </View>
                  <View style={[styles.toggle, s.completed ? styles.toggleOn : styles.toggleOff]}>
                    {s.completed ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Upcoming batch days */}
          {upcoming.length > 0 && (
            <>
              <Text style={styles.section}>Upcoming Batch Days</Text>
              {upcoming.map((u, i) => (
                <View key={i} style={styles.upcomingRow}>
                  <View style={styles.dateChip}>
                    <Text style={styles.dateChipDay}>{DAY_NAMES[(u.day.getDay() + 6) % 7]}</Text>
                    <Text style={styles.dateChipNum}>{u.day.getDate()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.batchName}>{u.batch.name}</Text>
                    <Text style={styles.batchTime}>{batchTime(u.batch)} · {monShort(u.date)}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function monShort(isoStr) { return new Date(isoStr).toLocaleDateString('en-GB', { month: 'short' }); }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(4) },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: theme.spacing(1) },
  weekLabel: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  dayStrip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing(2) },
  day: { flex: 1, alignItems: 'center', paddingVertical: 10, marginHorizontal: 2, borderRadius: 12 },
  dayActive: { backgroundColor: theme.colors.primary },
  dayName: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  dayNum: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginTop: 4 },
  dayTextActive: { color: '#fff' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.primary, marginTop: 4 },

  section: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginTop: theme.spacing(2.5), marginBottom: theme.spacing(1.5) },
  batchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 10 },
  batchName: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  batchTime: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },

  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing(2.5), marginBottom: theme.spacing(1.5) },
  planTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  completed: { color: theme.colors.textMuted, fontSize: 13 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderSoft },
  label: { color: theme.colors.text, fontSize: 15, fontWeight: '500' },
  drills: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  toggle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  toggleOn: { backgroundColor: theme.colors.success },
  toggleOff: { borderWidth: 1.5, borderColor: theme.colors.textFaint },

  upcomingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 10 },
  dateChip: { width: 46, height: 46, borderRadius: 12, backgroundColor: theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  dateChipDay: { color: theme.colors.primary, fontSize: 10, fontWeight: '700' },
  dateChipNum: { color: theme.colors.primary, fontSize: 16, fontWeight: '800' },
});
