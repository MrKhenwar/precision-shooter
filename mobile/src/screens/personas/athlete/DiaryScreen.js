import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { addDiaryEntry, getMyDiary } from '../../../api/performance';
import { Banner, Button, Field } from '../../../components/ui';
import { Stepper } from '../../../components/Stepper';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { theme } from '../../../theme';

export default function DiaryScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(3);
  const [hr, setHr] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const load = useCallback(async () => {
    try {
      setEntries(await getMyDiary());
    } catch (_) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onSave() {
    setError(null);
    setInfo(null);
    setSaving(true);
    try {
      await addDiaryEntry({
        sleep_quality: sleep,
        stress_level: stress,
        resting_hr: hr ? parseInt(hr, 10) : null,
        notes,
      });
      setInfo("Today's diary saved.");
      setShowForm(false);
      setNotes('');
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save diary.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <KeyboardScreen>
        {info ? <Banner kind="success">{info}</Banner> : null}
        <Button
          title={showForm ? 'Cancel' : "+ Today's entry"}
          variant={showForm ? 'ghost' : 'primary'}
          onPress={() => setShowForm((s) => !s)}
        />
        {showForm && (
          <View style={styles.form}>
            {error ? <Banner kind="error">{error}</Banner> : null}
            <Stepper label="Sleep quality" value={sleep} onChange={setSleep} />
            <Stepper label="Stress level" value={stress} onChange={setStress} />
            <Field label="Resting heart rate (bpm)" keyboardType="number-pad" value={hr} onChangeText={setHr} />
            <Field label="Training notes" value={notes} onChangeText={setNotes} multiline />
            <Button title="Save Entry" onPress={onSave} loading={saving} />
          </View>
        )}

        <Text style={styles.section}>History</Text>
        {entries.length === 0 ? (
          <Text style={styles.empty}>No diary entries yet.</Text>
        ) : (
          entries.map((e) => (
            <View key={e.id} style={styles.card}>
              <Text style={styles.date}>{e.date}</Text>
              <Text style={styles.meta}>
                Sleep {e.sleep_quality}/10 · Stress {e.stress_level}/10
                {e.resting_hr ? ` · ${e.resting_hr} bpm` : ''}
              </Text>
              {e.notes ? <Text style={styles.notes}>{e.notes}</Text> : null}
            </View>
          ))
        )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  form: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    marginTop: theme.spacing(2),
  },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: theme.spacing(1) },
  empty: { color: theme.colors.textMuted },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    marginBottom: 10,
  },
  date: { color: theme.colors.text, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, marginTop: 6, fontSize: 13 },
  notes: { color: theme.colors.textMuted, marginTop: 6, fontStyle: 'italic', fontSize: 13 },
});
