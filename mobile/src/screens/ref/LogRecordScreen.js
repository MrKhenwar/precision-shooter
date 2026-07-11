// Athlete logs a shooting session and reviews history.
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, EmptyState, Field, Header, Loading } from '../../components/kit';
import { fmtDay } from './labels';
import { addShootingRecord, getMyShootingRecords } from '../../api/performance';
import { theme } from '../../theme';

export default function LogRecordScreen({ navigation }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [f, setF] = useState({ shots: '', tens: '', group: '', score: '', notes: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    getMyShootingRecords().then(setRecords).catch(() => setRecords([])).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  async function onSave() {
    setError(null);
    if (!f.shots) return setError('Total shots is required.');
    setSaving(true);
    try {
      await addShootingRecord({
        total_shots: parseInt(f.shots, 10) || 0,
        inner_tens: parseInt(f.tens, 10) || 0,
        grouping_mm: f.group ? parseFloat(f.group) : null,
        total_score: f.score ? parseFloat(f.score) : null,
        notes: f.notes,
      });
      setF({ shots: '', tens: '', group: '', score: '', notes: '' });
      load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save record.');
    } finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Log Shooting Record" onLeft={() => navigation.goBack()} />
      {loading ? <Loading /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.formTitle}>New Session</Text>
              {error ? <Banner kind="error">{error}</Banner> : null}
              <View style={styles.row2}>
                <View style={{ flex: 1 }}><Field label="Total Shots" keyboardType="number-pad" value={f.shots} onChangeText={set('shots')} /></View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}><Field label="Inner 10s (10.3+)" keyboardType="number-pad" value={f.tens} onChangeText={set('tens')} /></View>
              </View>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}><Field label="Grouping (mm)" keyboardType="decimal-pad" value={f.group} onChangeText={set('group')} /></View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}><Field label="Total Score" keyboardType="decimal-pad" value={f.score} onChangeText={set('score')} /></View>
              </View>
              <Field label="Notes" value={f.notes} onChangeText={set('notes')} multiline />
              <Button title="Save Record" icon="save" onPress={onSave} loading={saving} />
            </View>

            <Text style={styles.section}>History</Text>
            {records.length === 0 ? (
              <EmptyState icon="document-text-outline" title="No sessions logged" sub="Your logged sessions appear here." />
            ) : records.map((r) => (
              <View key={r.id} style={styles.recCard}>
                <View style={styles.recHead}>
                  <Text style={styles.recDate}>{fmtDay(r.date)}</Text>
                  <Text style={styles.recPct}>{r.inner_ten_pct}% inner 10s</Text>
                </View>
                <Text style={styles.recMeta}>{r.total_shots} shots · {r.inner_tens} inner 10s{r.grouping_mm != null ? ` · ${r.grouping_mm}mm` : ''}{r.total_score != null ? ` · ${r.total_score}` : ''}</Text>
                {r.notes ? <Text style={styles.recNotes}>{r.notes}</Text> : null}
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
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
  formTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  row2: { flexDirection: 'row' },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: theme.spacing(1.5) },
  recCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 10 },
  recHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recDate: { color: theme.colors.text, fontWeight: '700', fontSize: 14 },
  recPct: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 },
  recMeta: { color: theme.colors.textMuted, fontSize: 13, marginTop: 6 },
  recNotes: { color: theme.colors.textMuted, fontSize: 13, marginTop: 6, fontStyle: 'italic' },
});
