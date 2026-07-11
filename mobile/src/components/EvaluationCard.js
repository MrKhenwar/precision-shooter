// Displays one evaluation: three pillar scores + sub-metric breakdown.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

function Pillar({ label, score }) {
  return (
    <View style={styles.pillar}>
      <Text style={styles.pillarScore}>{score}</Text>
      <Text style={styles.pillarLabel}>{label}</Text>
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}/10</Text>
    </View>
  );
}

export function EvaluationCard({ e }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.kind}>{e.kind === 'initial' ? 'Initial' : 'Periodic'} Evaluation</Text>
        <Text style={styles.date}>{e.date}</Text>
      </View>

      <View style={styles.pillars}>
        <Pillar label="Shooting" score={e.shooting_score} />
        <Pillar label="S&C" score={e.sc_score} />
        <Pillar label="Overall" score={e.overall_score} />
      </View>

      <Text style={styles.group}>Shooting</Text>
      <Metric label="Hold stability" value={e.hold_stability} />
      <Metric label="Trigger timing" value={e.trigger_timing} />
      <Metric label="Approach" value={e.approach} />
      <Metric label="Follow-through" value={e.follow_through} />

      <Text style={styles.group}>Strength & Conditioning</Text>
      <Metric label="Core strength" value={e.core_strength} />
      <Metric label="Cardio endurance" value={e.cardio_endurance} />
      <Metric label="Balance index" value={e.balance_index} />

      {e.notes ? <Text style={styles.notes}>{e.notes}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    marginBottom: 12,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kind: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  date: { color: theme.colors.textMuted, fontSize: 13 },
  pillars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius,
  },
  pillar: { alignItems: 'center' },
  pillarScore: { color: theme.colors.primary, fontSize: 24, fontWeight: '800' },
  pillarLabel: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  group: { color: theme.colors.text, fontWeight: '700', marginTop: 10, marginBottom: 4, fontSize: 13 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  metricLabel: { color: theme.colors.textMuted, fontSize: 13 },
  metricValue: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  notes: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontStyle: 'italic',
    fontSize: 13,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
});
