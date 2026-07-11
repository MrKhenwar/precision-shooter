import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { addShootingRecord, getMyShootingRecords } from '../../../api/performance';
import { Banner, Button, Field } from '../../../components/ui';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { StatRing } from '../../../components/StatRing';
import { theme } from '../../../theme';

export default function ShootingRecordScreen() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [shots, setShots] = useState('');
  const [innerTens, setInnerTens] = useState('');
  const [grouping, setGrouping] = useState('');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setRecords(await getMyShootingRecords());
    } catch (_) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onSave() {
    setError(null);
    if (!shots) {
      setError('Total shots is required.');
      return;
    }
    setSaving(true);
    try {
      await addShootingRecord({
        total_shots: parseInt(shots, 10) || 0,
        inner_tens: parseInt(innerTens, 10) || 0,
        grouping_mm: grouping ? parseFloat(grouping) : null,
        total_score: score ? parseFloat(score) : null,
        notes,
      });
      setShots(''); setInnerTens(''); setGrouping(''); setScore(''); setNotes('');
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save record.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  const totalSessions = records.length;
  const totalShots = records.reduce((t, r) => t + (r.total_shots || 0), 0);
  const totalTens = records.reduce((t, r) => t + (r.inner_tens || 0), 0);
  const avgInnerTen = totalShots ? Math.round((100 * totalTens) / totalShots) : 0;
  const groups = records.filter((r) => r.grouping_mm != null).map((r) => r.grouping_mm);
  const bestGroup = groups.length ? Math.min(...groups) : null;

  return (
    <KeyboardScreen>
        {totalSessions > 0 && (
          <View style={styles.statsCard}>
            <StatRing value={avgInnerTen} max={100} size={84} color={theme.colors.primary} centerText={`${avgInnerTen}%`} label="Avg inner-10" />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalShots}</Text>
              <Text style={styles.statLabel}>Total shots</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>{bestGroup != null ? `${bestGroup}mm` : '—'}</Text>
              <Text style={styles.statLabel}>Best group</Text>
            </View>
          </View>
        )}
        <Button
          title={showForm ? 'Cancel' : '+ Log a session'}
          variant={showForm ? 'ghost' : 'primary'}
          onPress={() => setShowForm((s) => !s)}
        />
        {showForm && (
          <View style={styles.form}>
            {error ? <Banner kind="error">{error}</Banner> : null}
            <Field label="Total shots" keyboardType="number-pad" value={shots} onChangeText={setShots} />
            <Field label="Inner tens (10.3+)" keyboardType="number-pad" value={innerTens} onChangeText={setInnerTens} />
            <Field label="Grouping size (mm)" keyboardType="decimal-pad" value={grouping} onChangeText={setGrouping} />
            <Field label="Total score" keyboardType="decimal-pad" value={score} onChangeText={setScore} />
            <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
            <Button title="Save Record" onPress={onSave} loading={saving} />
          </View>
        )}

        <Text style={styles.section}>History</Text>
        {records.length === 0 ? (
          <Text style={styles.empty}>No sessions logged yet.</Text>
        ) : (
          records.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.date}>{r.date}</Text>
                <Text style={styles.pct}>{r.inner_ten_pct}% inner-10</Text>
              </View>
              <Text style={styles.meta}>
                {r.total_shots} shots · {r.inner_tens} inner-tens
                {r.grouping_mm != null ? ` · ${r.grouping_mm}mm group` : ''}
                {r.total_score != null ? ` · ${r.total_score}` : ''}
              </Text>
              {r.notes ? <Text style={styles.notes}>{r.notes}</Text> : null}
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
  statsCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1,
    borderRadius: theme.radius, padding: 16, marginBottom: theme.spacing(2),
  },
  statBox: { alignItems: 'center' },
  statValue: { color: theme.colors.primary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 },
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
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: theme.colors.text, fontWeight: '700' },
  pct: { color: theme.colors.primary, fontWeight: '800' },
  meta: { color: theme.colors.textMuted, marginTop: 6, fontSize: 13 },
  notes: { color: theme.colors.textMuted, marginTop: 6, fontStyle: 'italic', fontSize: 13 },
});
