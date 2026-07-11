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

import { getMyAttendance, getMyBatches, selfCheckIn } from '../../../api/athlete';
import { Banner, Button } from '../../../components/ui';
import { AttendanceCalendar } from '../../../components/AttendanceCalendar';
import { StatRing } from '../../../components/StatRing';
import { theme } from '../../../theme';

function attColor(p) {
  if (p >= 85) return theme.colors.success;
  if (p >= 60) return theme.colors.warning;
  return theme.colors.danger;
}

const STATUS_COLOR = {
  present: theme.colors.success,
  late: theme.colors.warning,
  absent: theme.colors.danger,
  excused: theme.colors.textMuted,
};

export default function AttendanceScreen() {
  const [data, setData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const load = useCallback(async () => {
    try {
      const [att, b] = await Promise.all([getMyAttendance(), getMyBatches()]);
      setData(att);
      setBatches(b);
      if (b.length === 1) setSelectedBatch(b[0].id);
    } catch (_) {
      setError('Could not load attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function onCheckIn() {
    setChecking(true);
    setError(null);
    setInfo(null);
    try {
      const res = await selfCheckIn(selectedBatch, 'qr');
      setInfo(res.message);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Check-in failed.');
    } finally {
      setChecking(false);
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
        <View style={styles.pctCard}>
          <StatRing
            value={data?.attendance_pct ?? 0}
            max={100}
            size={110}
            stroke={11}
            color={attColor(data?.attendance_pct ?? 0)}
            centerText={`${data?.attendance_pct ?? 0}%`}
          />
          <Text style={styles.pctLabel}>Attendance · {data?.total_sessions ?? 0} sessions</Text>
        </View>

        {error ? <Banner kind="error">{error}</Banner> : null}
        {info ? <Banner kind="success">{info}</Banner> : null}

        <Text style={styles.section}>Calendar</Text>
        <AttendanceCalendar records={data?.records || []} />

        <Text style={styles.section}>Check in for today</Text>
        {batches.length > 1 && (
          <View style={styles.batchRow}>
            {batches.map((b) => {
              const active = selectedBatch === b.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => setSelectedBatch(b.id)}
                  style={[styles.batchChip, active && styles.batchChipActive]}
                >
                  <Text style={[styles.batchText, active && styles.batchTextActive]}>{b.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <Button title="Self Check-in" onPress={onCheckIn} loading={checking} />
        <Text style={styles.note}>
          Self check-in records you as present for today (QR / geofence verified at the range).
        </Text>

        <Text style={styles.section}>Recent records</Text>
        {(data?.records || []).length === 0 ? (
          <Text style={styles.empty}>No attendance yet.</Text>
        ) : (
          data.records.map((r) => (
            <View key={r.id} style={styles.recordRow}>
              <Text style={styles.date}>{r.date}</Text>
              <Text style={[styles.status, { color: STATUS_COLOR[r.status] || theme.colors.text }]}>
                {r.status}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  pctCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 20,
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  pctValue: { color: theme.colors.primary, fontSize: 40, fontWeight: '800' },
  pctLabel: { color: theme.colors.textMuted, marginTop: 4 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(2), marginBottom: theme.spacing(1) },
  note: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8 },
  empty: { color: theme.colors.textMuted },
  batchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing(1) },
  batchChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  batchChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  batchText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  batchTextActive: { color: theme.colors.primaryText },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 14,
    marginBottom: 8,
  },
  date: { color: theme.colors.text, fontWeight: '600' },
  status: { fontWeight: '700', textTransform: 'capitalize' },
});
