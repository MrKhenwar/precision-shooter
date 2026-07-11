// Batches — live list + create batch (FR-007). Tap a batch to open detail.
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, ChipSelect, EmptyState, Field, IconTile, Loading } from '../../components/kit';
import { createBatch, getBatches } from '../../api/coach';
import { theme } from '../../theme';

const COLORS = [theme.colors.primary, theme.colors.success, theme.colors.danger, theme.colors.orange, theme.colors.purple];
const DAYS = [
  { value: 'mon', label: 'Mon' }, { value: 'tue', label: 'Tue' }, { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' }, { value: 'fri', label: 'Fri' }, { value: 'sat', label: 'Sat' }, { value: 'sun', label: 'Sun' },
];

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const h12 = ((hr + 11) % 12) + 1;
  return `${String(h12).padStart(2, '0')}:${m || '00'} ${ampm}`;
}

export default function BatchesScreen({ navigation }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: '', capacity: '20', days: [], start_time: '', end_time: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    getBatches().then(setBatches).catch(() => setBatches([])).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  async function create() {
    setError(null);
    if (!f.name.trim()) return setError('Batch name is required.');
    const badTime = (t) => t && !/^\d{1,2}:\d{2}$/.test(t);
    if (badTime(f.start_time) || badTime(f.end_time)) return setError('Time must be HH:MM (24h).');
    setSaving(true);
    try {
      await createBatch({
        name: f.name.trim(),
        capacity: parseInt(f.capacity, 10) || 20,
        days: f.days.join(','),
        start_time: f.start_time || null,
        end_time: f.end_time || null,
      });
      setF({ name: '', capacity: '20', days: [], start_time: '', end_time: '' });
      setShow(false);
      load();
    } catch (e) { setError(e.response?.data?.detail || 'Could not create batch.'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.text} onPress={() => navigation.goBack?.()} />
        <Text style={styles.headerTitle}>Batches</Text>
        <Pressable style={styles.addBtn} onPress={() => setShow((s) => !s)}>
          <Ionicons name={show ? 'close' : 'add'} size={16} color={theme.colors.primary} />
          <Text style={styles.addText}>{show ? 'Close' : 'Add Batch'}</Text>
        </Pressable>
      </View>

      {loading ? <Loading /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {show && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>New Batch</Text>
                {error ? <Banner kind="error">{error}</Banner> : null}
                <Field label="Batch Name" placeholder="e.g. Morning Batch" value={f.name} onChangeText={set('name')} />
                <Field label="Capacity" keyboardType="number-pad" value={f.capacity} onChangeText={set('capacity')} />
                <ChipSelect label="Days of Week" options={DAYS} value={f.days} onChange={set('days')} multi />
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1 }}><Field label="Start (HH:MM)" placeholder="06:00" value={f.start_time} onChangeText={set('start_time')} autoCapitalize="none" /></View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}><Field label="End (HH:MM)" placeholder="08:00" value={f.end_time} onChangeText={set('end_time')} autoCapitalize="none" /></View>
                </View>
                <Button title="Create Batch" icon="add-circle" onPress={create} loading={saving} />
              </View>
            )}

            {batches.length === 0 && !show ? (
              <EmptyState icon="grid-outline" title="No batches yet" sub="Tap Add Batch to create one." />
            ) : batches.map((b, i) => (
              <Pressable key={b.id} style={styles.card} onPress={() => navigation.navigate('BatchDetail', { batch: b })}>
                <IconTile icon="people" color={COLORS[i % COLORS.length]} size={52} iconSize={24} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.name}>{b.name}</Text>
                  <Text style={styles.time}>{b.start_time ? `${fmtTime(b.start_time)} - ${fmtTime(b.end_time)}` : (b.days || 'Schedule not set')}</Text>
                </View>
                <Text style={styles.count}>{b.member_count ?? 0} Athletes</Text>
              </Pressable>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1.5) },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center' },
  addText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600', marginLeft: 3 },
  content: { paddingHorizontal: theme.spacing(2), paddingTop: theme.spacing(1), paddingBottom: theme.spacing(4) },
  form: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 16 },
  formTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 14 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  time: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
  count: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
});
