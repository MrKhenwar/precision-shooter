import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createEvaluation } from '../../../api/performance';
import { Banner, Button, Field } from '../../../components/ui';
import { Stepper } from '../../../components/Stepper';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { theme } from '../../../theme';

export default function EvaluationFormScreen({ route, navigation }) {
  const { athlete } = route.params; // { id, full_name }
  const [kind, setKind] = useState('periodic');
  const [s, setS] = useState({
    hold_stability: 5, trigger_timing: 5, approach: 5, follow_through: 5,
    core_strength: 5, cardio_endurance: 5, balance_index: 5,
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (v) => setS((prev) => ({ ...prev, [k]: v }));
  const avg = (keys) => (keys.reduce((t, k) => t + s[k], 0) / keys.length).toFixed(1);
  const shooting = avg(['hold_stability', 'trigger_timing', 'approach', 'follow_through']);
  const sc = avg(['core_strength', 'cardio_endurance', 'balance_index']);
  const overall = ((parseFloat(shooting) + parseFloat(sc)) / 2).toFixed(1);

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      await createEvaluation({ athlete_id: athlete.id, kind, ...s, notes });
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save evaluation.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardScreen>
        <Text style={styles.name}>{athlete.full_name || `Athlete #${athlete.id}`}</Text>
        {error ? <Banner kind="error">{error}</Banner> : null}

        <View style={styles.kindRow}>
          {[['initial', 'Initial'], ['periodic', 'Periodic']].map(([v, lbl]) => {
            const active = kind === v;
            return (
              <Pressable key={v} onPress={() => setKind(v)} style={[styles.kindChip, active && styles.kindActive]}>
                <Text style={[styles.kindText, active && styles.kindTextActive]}>{lbl}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.scoreCard}>
          <Score label="Shooting" v={shooting} />
          <Score label="S&C" v={sc} />
          <Score label="Overall" v={overall} />
        </View>

        <Text style={styles.group}>Shooting</Text>
        <Stepper label="Hold stability" value={s.hold_stability} onChange={set('hold_stability')} />
        <Stepper label="Trigger timing" value={s.trigger_timing} onChange={set('trigger_timing')} />
        <Stepper label="Approach" value={s.approach} onChange={set('approach')} />
        <Stepper label="Follow-through" value={s.follow_through} onChange={set('follow_through')} />

        <Text style={styles.group}>Strength & Conditioning</Text>
        <Stepper label="Core strength" value={s.core_strength} onChange={set('core_strength')} />
        <Stepper label="Cardio endurance" value={s.cardio_endurance} onChange={set('cardio_endurance')} />
        <Stepper label="Balance index" value={s.balance_index} onChange={set('balance_index')} />

        <View style={{ height: 10 }} />
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
        <Button title="Save Evaluation" onPress={onSave} loading={saving} />
    </KeyboardScreen>
  );
}

function Score({ label, v }) {
  return (
    <View style={styles.score}>
      <Text style={styles.scoreValue}>{v}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  name: { color: theme.colors.text, fontSize: 20, fontWeight: '800', marginBottom: theme.spacing(2) },
  kindRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing(2) },
  kindChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    paddingVertical: 12,
    alignItems: 'center',
  },
  kindActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  kindText: { color: theme.colors.textMuted, fontWeight: '700' },
  kindTextActive: { color: theme.colors.primaryText },
  scoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    paddingVertical: 14,
    marginBottom: theme.spacing(2),
  },
  score: { alignItems: 'center' },
  scoreValue: { color: theme.colors.primary, fontSize: 24, fontWeight: '800' },
  scoreLabel: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  group: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(2), marginBottom: 4 },
});
