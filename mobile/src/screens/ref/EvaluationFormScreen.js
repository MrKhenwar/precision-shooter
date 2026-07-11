// Coach creates an evaluation (0–10 scores) for a specific athlete.
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, Field, Header, SegTabs } from '../../components/kit';
import { createEvaluation } from '../../api/performance';
import { theme } from '../../theme';

const METRICS = [
  { key: 'hold_stability', label: 'Hold Stability' },
  { key: 'trigger_timing', label: 'Trigger Timing' },
  { key: 'approach', label: 'Approach' },
  { key: 'follow_through', label: 'Follow Through' },
  { key: 'core_strength', label: 'Core Strength' },
  { key: 'cardio_endurance', label: 'Cardio Endurance' },
  { key: 'balance_index', label: 'Balance Index' },
];

function Stepper({ value, onChange }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(Math.max(0, value - 1))} style={styles.stepBtn}><Ionicons name="remove" size={18} color={theme.colors.text} /></Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(10, value + 1))} style={styles.stepBtn}><Ionicons name="add" size={18} color={theme.colors.text} /></Pressable>
    </View>
  );
}

export default function EvaluationFormScreen({ navigation, route }) {
  const { athleteId, name } = route.params || {};
  const [kind, setKind] = useState('periodic');
  const [scores, setScores] = useState(() => Object.fromEntries(METRICS.map((m) => [m.key, 5])));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      await createEvaluation({ athlete_id: athleteId, kind, ...scores, notes });
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save evaluation.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="New Evaluation" onLeft={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {name ? <Text style={styles.subject}>Evaluating {name}</Text> : null}
          {error ? <Banner kind="error">{error}</Banner> : null}

          <Text style={styles.label}>Evaluation Type</Text>
          <SegTabs items={[{ value: 'periodic', label: 'Periodic' }, { value: 'initial', label: 'Initial' }]} value={kind} onChange={setKind} style={{ marginBottom: 8 }} />

          <View style={styles.card}>
            {METRICS.map((m, i) => (
              <View key={m.key} style={[styles.metricRow, i !== METRICS.length - 1 && styles.metricBorder]}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Stepper value={scores[m.key]} onChange={(v) => setScores((s) => ({ ...s, [m.key]: v }))} />
              </View>
            ))}
          </View>

          <Field label="Notes" placeholder="Observations, focus areas…" value={notes} onChangeText={setNotes} multiline style={{ marginTop: 14 }} />
          <Button title="Save Evaluation" icon="save" onPress={onSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  subject: { color: theme.colors.text, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  label: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 8 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, marginTop: 8 },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  metricBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderSoft },
  metricLabel: { color: theme.colors.text, fontSize: 15, fontWeight: '500' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  stepValue: { color: theme.colors.text, fontSize: 16, fontWeight: '800', minWidth: 22, textAlign: 'center' },
});
