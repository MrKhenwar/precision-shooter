// Athlete evaluations — coach-authored assessment history with scores.
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Header, Loading } from '../../components/kit';
import { cap, fmtDay } from './labels';
import { getMyEvaluations, getAthleteEvaluations } from '../../api/performance';
import { theme } from '../../theme';

function Bar({ label, value }) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(value / 10) * 100}%` }]} /></View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

export default function MyEvaluationsScreen({ navigation, route }) {
  const athleteId = route?.params?.athleteId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    (athleteId ? getAthleteEvaluations(athleteId) : getMyEvaluations())
      .then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, [athleteId]);
  useFocusEffect(load);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Evaluations" onLeft={() => navigation.goBack()} />
      {loading ? <Loading /> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <EmptyState icon="clipboard-outline" title="No evaluations yet" sub="Your coach's assessments appear here." />
          ) : items.map((e) => (
            <View key={e.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View>
                  <Text style={styles.kind}>{cap(e.kind)} Evaluation</Text>
                  <Text style={styles.date}>{fmtDay(e.date)}</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreValue}>{e.overall_score}</Text>
                  <Text style={styles.scoreMax}>/10</Text>
                </View>
              </View>
              <View style={styles.bars}>
                <Bar label="Hold Stability" value={e.hold_stability} />
                <Bar label="Trigger Timing" value={e.trigger_timing} />
                <Bar label="Approach" value={e.approach} />
                <Bar label="Follow Through" value={e.follow_through} />
                <Bar label="Core Strength" value={e.core_strength} />
                <Bar label="Cardio" value={e.cardio_endurance} />
                <Bar label="Balance" value={e.balance_index} />
              </View>
              {e.notes ? <Text style={styles.notes}>{e.notes}</Text> : null}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  kind: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  date: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
  scoreBadge: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: theme.colors.primaryDim, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  scoreValue: { color: theme.colors.primary, fontSize: 22, fontWeight: '800' },
  scoreMax: { color: theme.colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 3, marginLeft: 1 },
  bars: { gap: 9 },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  barLabel: { color: theme.colors.textMuted, fontSize: 12, width: 100 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceAlt, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
  barValue: { color: theme.colors.text, fontSize: 12, fontWeight: '700', width: 20, textAlign: 'right' },
  notes: { color: theme.colors.textMuted, fontSize: 13, marginTop: 14, fontStyle: 'italic', lineHeight: 19 },
});
