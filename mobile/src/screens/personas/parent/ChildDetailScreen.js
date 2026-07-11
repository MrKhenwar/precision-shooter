import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getChildDetail } from '../../../api/personas';
import { EvaluationCard } from '../../../components/EvaluationCard';
import { theme } from '../../../theme';

const TABS = [['attendance', 'Attendance'], ['evaluations', 'Evaluations'], ['diary', 'Diary']];

export default function ChildDetailScreen({ route }) {
  const { child } = route.params;
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('attendance');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await getChildDetail(child.id));
    } catch (_) { /* ignore */ } finally {
      setLoading(false);
    }
  }, [child.id]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  if (loading || !data) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={{ padding: theme.spacing(2), paddingBottom: 0 }}>
        <Text style={styles.name}>{data.summary.full_name}</Text>
        <Text style={styles.meta}>
          {data.summary.current_tier} · {data.summary.attendance_pct}% attendance
          {data.summary.coach_name ? ` · Coach ${data.summary.coach_name}` : ''}
        </Text>
        <View style={styles.tabs}>
          {TABS.map(([key, lbl]) => {
            const active = tab === key;
            return (
              <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{lbl}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
        {tab === 'attendance' &&
          (data.attendance.length === 0 ? (
            <Text style={styles.empty}>No attendance records.</Text>
          ) : (
            data.attendance.map((r) => (
              <View key={r.id} style={styles.row}>
                <Text style={styles.date}>{r.date}</Text>
                <Text style={[styles.status, { color: statusColor(r.status) }]}>{r.status}</Text>
              </View>
            ))
          ))}

        {tab === 'evaluations' &&
          (data.evaluations.length === 0 ? (
            <Text style={styles.empty}>No evaluations yet.</Text>
          ) : (
            data.evaluations.map((e) => <EvaluationCard key={e.id} e={e} />)
          ))}

        {tab === 'diary' &&
          (data.diary.length === 0 ? (
            <Text style={styles.empty}>No diary entries.</Text>
          ) : (
            data.diary.map((e) => (
              <View key={e.id} style={styles.row}>
                <Text style={styles.date}>{e.date}</Text>
                <Text style={styles.meta}>Sleep {e.sleep_quality}/10 · Stress {e.stress_level}/10{e.resting_hr ? ` · ${e.resting_hr} bpm` : ''}</Text>
              </View>
            ))
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function statusColor(s) {
  return { present: theme.colors.success, late: theme.colors.warning, absent: theme.colors.danger }[s] || theme.colors.textMuted;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  meta: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13, textTransform: 'capitalize' },
  tabs: { flexDirection: 'row', gap: 8, marginTop: theme.spacing(2) },
  tab: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: theme.colors.primaryText },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 14, marginBottom: 8 },
  date: { color: theme.colors.text, fontWeight: '600' },
  status: { fontWeight: '700', textTransform: 'capitalize' },
});
