import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { createBatch, getBatches } from '../../../api/coach';
import { Banner, Button, Field } from '../../../components/ui';
import { theme } from '../../../theme';

const DAYS = [
  ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'],
  ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun'],
];

export default function BatchesScreen({ navigation }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [days, setDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setBatches(await getBatches());
    } catch (_) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function onCreate() {
    setError(null);
    if (!name.trim()) {
      setError('Batch name is required.');
      return;
    }
    setSaving(true);
    try {
      await createBatch({
        name: name.trim(),
        capacity: parseInt(capacity, 10) || 20,
        days: days.join(','),
      });
      setName('');
      setCapacity('20');
      setDays([]);
      setShowForm(false);
      await load();
    } catch (e) {
      const d = e.response?.data;
      setError(d?.detail || (d ? Object.values(d).flat().join(' ') : 'Could not create batch.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
        <Button
          title={showForm ? 'Cancel' : '+ New Batch'}
          variant={showForm ? 'ghost' : 'primary'}
          onPress={() => setShowForm((s) => !s)}
        />

        {showForm && (
          <View style={styles.form}>
            {error ? <Banner kind="error">{error}</Banner> : null}
            <Field label="Batch name" placeholder="Morning Rifle" value={name} onChangeText={setName} />
            <Field
              label="Capacity"
              keyboardType="number-pad"
              value={capacity}
              onChangeText={setCapacity}
            />
            <Text style={styles.label}>Training days</Text>
            <View style={styles.dayRow}>
              {DAYS.map(([code, lbl]) => {
                const active = days.includes(code);
                return (
                  <Pressable
                    key={code}
                    onPress={() => toggleDay(code)}
                    style={[styles.day, active && styles.dayActive]}
                  >
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>{lbl}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button title="Create Batch" onPress={onCreate} loading={saving} />
          </View>
        )}

        <Text style={styles.section}>Your batches</Text>
        {batches.length === 0 ? (
          <Text style={styles.empty}>No batches yet. Create one above.</Text>
        ) : (
          batches.map((b) => (
            <Pressable
              key={b.id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('BatchDetail', { batch: b })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{b.name}</Text>
                <Text style={styles.meta}>
                  {b.member_count}/{b.capacity} athletes
                  {b.days ? ` · ${b.days.split(',').join(' ').toUpperCase()}` : ''}
                </Text>
              </View>
              {b.is_full ? <Text style={styles.fullBadge}>Full</Text> : null}
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
  label: { color: theme.colors.textMuted, marginBottom: 8, fontSize: 13 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing(2) },
  day: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    width: 46,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dayActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dayText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 12 },
  dayTextActive: { color: theme.colors.primaryText },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: theme.spacing(1) },
  empty: { color: theme.colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    marginBottom: 10,
  },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13 },
  fullBadge: {
    color: theme.colors.warning,
    borderColor: theme.colors.warning,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    marginRight: 8,
  },
  chevron: { color: theme.colors.textMuted, fontSize: 26 },
});
