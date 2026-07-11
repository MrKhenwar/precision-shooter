// Coach course plans — list macro/meso cycles and create new ones.
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, EmptyState, Field, Header, Loading, SegTabs } from '../../components/kit';
import { cap, fmtDate } from './labels';
import { createCoursePlan, getCoursePlans } from '../../api/training';
import { theme } from '../../theme';

export default function CoursePlansScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [cycle, setCycle] = useState('meso');
  const [themes, setThemes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getCoursePlans().then(setPlans).catch(() => setPlans([])).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  async function onSave() {
    setError(null);
    if (!title.trim()) return setError('Give the plan a title.');
    setSaving(true);
    try {
      await createCoursePlan({ title: title.trim(), cycle, themes });
      setTitle(''); setThemes(''); setCycle('meso'); setShow(false);
      load();
    } catch (e) { setError(e.response?.data?.detail || 'Could not save plan.'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Course Plans" onLeft={() => navigation.goBack()} right={show ? 'close' : 'add'} onRight={() => setShow((s) => !s)} />
      {loading ? <Loading /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {show && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>New Course Plan</Text>
                {error ? <Banner kind="error">{error}</Banner> : null}
                <Field label="Title" placeholder="e.g. Pre-Nationals Build" value={title} onChangeText={setTitle} />
                <Text style={styles.label}>Cycle</Text>
                <SegTabs items={[{ value: 'meso', label: 'Mesocycle' }, { value: 'macro', label: 'Macrocycle' }]} value={cycle} onChange={setCycle} style={{ marginBottom: 14 }} />
                <Field label="Themes & Goals" placeholder="Technical themes, competition peaks…" value={themes} onChangeText={setThemes} multiline />
                <Button title="Save Plan" icon="save" onPress={onSave} loading={saving} />
              </View>
            )}

            {plans.length === 0 && !show ? (
              <EmptyState icon="albums-outline" title="No course plans" sub="Tap + to create a macro/meso cycle." />
            ) : plans.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHead}>
                  <Ionicons name="albums" size={20} color={theme.colors.purple} />
                  <Text style={styles.planTitle}>{p.title}</Text>
                  <View style={styles.cycleBadge}><Text style={styles.cycleText}>{cap(p.cycle)}</Text></View>
                </View>
                {p.themes ? <Text style={styles.themes}>{p.themes}</Text> : null}
                <Text style={styles.meta}>{p.session_count || 0} sessions{p.start_date ? ` · from ${fmtDate(p.start_date)}` : ''}</Text>
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  form: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 16 },
  formTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  label: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 8 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  planTitle: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '700', marginLeft: 10 },
  cycleBadge: { backgroundColor: theme.colors.primaryDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  cycleText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
  themes: { color: theme.colors.textMuted, fontSize: 13, marginTop: 10, lineHeight: 19 },
  meta: { color: theme.colors.textFaint, fontSize: 12, marginTop: 10 },
});
