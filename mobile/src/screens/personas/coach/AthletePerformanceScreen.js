import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import {
  getAthleteDiary,
  getAthleteEvaluations,
  getAthleteShootingRecords,
} from '../../../api/performance';
import { Button } from '../../../components/ui';
import { EvaluationCard } from '../../../components/EvaluationCard';
import { theme } from '../../../theme';

const TABS = [['evals', 'Evaluations'], ['records', 'Records'], ['diary', 'Diary']];

export default function AthletePerformanceScreen({ route, navigation }) {
  const { athlete } = route.params;
  const [tab, setTab] = useState('evals');
  const [data, setData] = useState({ evals: [], records: [], diary: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [evals, records, diary] = await Promise.all([
        getAthleteEvaluations(athlete.id),
        getAthleteShootingRecords(athlete.id),
        getAthleteDiary(athlete.id),
      ]);
      setData({ evals, records, diary });
    } catch (_) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [athlete.id]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={{ padding: theme.spacing(2), paddingBottom: 0 }}>
        <Text style={styles.name}>{athlete.full_name || `Athlete #${athlete.id}`}</Text>
        <Button
          title="+ New Evaluation"
          onPress={() => navigation.navigate('EvaluationForm', { athlete })}
        />
        <View style={{ height: 8 }} />
        <Button
          title="+ Assign Training Session"
          variant="ghost"
          onPress={() => navigation.navigate('AssignSession', { athlete })}
        />
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

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
          {tab === 'evals' &&
            (data.evals.length === 0 ? (
              <Text style={styles.empty}>No evaluations yet.</Text>
            ) : (
              data.evals.map((e) => <EvaluationCard key={e.id} e={e} />)
            ))}

          {tab === 'records' &&
            (data.records.length === 0 ? (
              <Text style={styles.empty}>No shooting records logged.</Text>
            ) : (
              data.records.map((r) => (
                <View key={r.id} style={styles.row}>
                  <View style={styles.rowHead}>
                    <Text style={styles.date}>{r.date}</Text>
                    <Text style={styles.pct}>{r.inner_ten_pct}% inner-10</Text>
                  </View>
                  <Text style={styles.meta}>
                    {r.total_shots} shots · {r.inner_tens} inner-tens
                    {r.grouping_mm != null ? ` · ${r.grouping_mm}mm` : ''}
                    {r.total_score != null ? ` · ${r.total_score}` : ''}
                  </Text>
                </View>
              ))
            ))}

          {tab === 'diary' &&
            (data.diary.length === 0 ? (
              <Text style={styles.empty}>No diary entries.</Text>
            ) : (
              data.diary.map((e) => (
                <View key={e.id} style={styles.row}>
                  <Text style={styles.date}>{e.date}</Text>
                  <Text style={styles.meta}>
                    Sleep {e.sleep_quality}/10 · Stress {e.stress_level}/10
                    {e.resting_hr ? ` · ${e.resting_hr} bpm` : ''}
                  </Text>
                  {e.notes ? <Text style={styles.notes}>{e.notes}</Text> : null}
                </View>
              ))
            ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { paddingTop: 60, alignItems: 'center' },
  name: { color: theme.colors.text, fontSize: 20, fontWeight: '800', marginBottom: theme.spacing(1) },
  tabs: { flexDirection: 'row', gap: 8, marginTop: theme.spacing(2) },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: theme.colors.primaryText },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
  row: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    marginBottom: 10,
  },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: theme.colors.text, fontWeight: '700' },
  pct: { color: theme.colors.primary, fontWeight: '800' },
  meta: { color: theme.colors.textMuted, marginTop: 6, fontSize: 13 },
  notes: { color: theme.colors.textMuted, marginTop: 6, fontStyle: 'italic', fontSize: 13 },
});
