import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { createCoursePlan, getCoursePlans } from '../../../api/training';
import { Banner, Button, Field } from '../../../components/ui';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { theme } from '../../../theme';

export default function CoursePlansScreen() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [cycle, setCycle] = useState('meso');
  const [themes, setThemes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setPlans(await getCoursePlans());
    } catch (_) { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onCreate() {
    setError(null);
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    try {
      await createCoursePlan({ title: title.trim(), cycle, themes });
      setTitle(''); setThemes(''); setCycle('meso'); setShowForm(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not create plan.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <KeyboardScreen>
        <Button
          title={showForm ? 'Cancel' : '+ New Course Plan'}
          variant={showForm ? 'ghost' : 'primary'}
          onPress={() => setShowForm((s) => !s)}
        />
        {showForm && (
          <View style={styles.form}>
            {error ? <Banner kind="error">{error}</Banner> : null}
            <Field label="Title" placeholder="Q3 Build" value={title} onChangeText={setTitle} />
            <Text style={styles.label}>Cycle</Text>
            <View style={styles.row}>
              {[['macro', 'Macrocycle'], ['meso', 'Mesocycle']].map(([v, lbl]) => {
                const active = cycle === v;
                return (
                  <Pressable key={v} onPress={() => setCycle(v)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{lbl}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field label="Themes / goals" value={themes} onChangeText={setThemes} multiline />
            <Button title="Create Plan" onPress={onCreate} loading={saving} />
          </View>
        )}

        <Text style={styles.section}>Your plans</Text>
        {plans.length === 0 ? (
          <Text style={styles.empty}>No course plans yet.</Text>
        ) : (
          plans.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.title}>{p.title}</Text>
                <Text style={styles.cycle}>{p.cycle === 'macro' ? 'Macro' : 'Meso'}</Text>
              </View>
              {p.themes ? <Text style={styles.themes}>{p.themes}</Text> : null}
              <Text style={styles.meta}>{p.session_count} sessions</Text>
            </View>
          ))
        )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  form: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginTop: theme.spacing(2) },
  label: { color: theme.colors.textMuted, marginBottom: 8, fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing(2) },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: theme.colors.primaryText },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: theme.spacing(1) },
  empty: { color: theme.colors.textMuted },
  card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginBottom: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  cycle: { color: theme.colors.primary, fontWeight: '700', fontSize: 12 },
  themes: { color: theme.colors.textMuted, marginTop: 6, fontSize: 13 },
  meta: { color: theme.colors.textMuted, marginTop: 6, fontSize: 12 },
});
