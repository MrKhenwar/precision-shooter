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

import {
  addBatchMember,
  getBatchAttendance,
  getBatchMembers,
  getRoster,
  markBatchAttendance,
  removeBatchMember,
} from '../../../api/coach';
import { Banner, Button } from '../../../components/ui';
import { theme } from '../../../theme';

const STATUSES = [
  ['present', 'P', theme.colors.success],
  ['late', 'L', theme.colors.warning],
  ['absent', 'A', theme.colors.danger],
];

export default function BatchDetailScreen({ route }) {
  const { batch } = route.params;
  const [members, setMembers] = useState([]);
  const [statuses, setStatuses] = useState({}); // athleteId -> status
  const [roster, setRoster] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const load = useCallback(async () => {
    try {
      const [mem, att, ros] = await Promise.all([
        getBatchMembers(batch.id),
        getBatchAttendance(batch.id),
        getRoster(),
      ]);
      setMembers(mem);
      setRoster(ros);
      // Pre-fill statuses from today's saved records; default to present.
      const map = {};
      mem.forEach((m) => (map[m.id] = 'present'));
      att.records.forEach((r) => (map[r.athlete] = r.status));
      setStatuses(map);
      setError(null);
    } catch (_) {
      setError('Could not load batch.');
    } finally {
      setLoading(false);
    }
  }, [batch.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function onSaveAttendance() {
    setSaving(true);
    setInfo(null);
    setError(null);
    try {
      const entries = members.map((m) => ({ athlete_id: m.id, status: statuses[m.id] || 'present' }));
      const res = await markBatchAttendance(batch.id, entries);
      setInfo(res.message);
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  }

  async function addMember(athleteId) {
    setError(null);
    try {
      await addBatchMember(batch.id, athleteId);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not add athlete.');
    }
  }

  async function removeMember(athleteId) {
    setError(null);
    try {
      await removeBatchMember(batch.id, athleteId);
      await load();
    } catch (e) {
      setError('Could not remove athlete.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const memberIds = new Set(members.map((m) => m.id));
  const addable = roster.filter((a) => !memberIds.has(a.id));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
        <Text style={styles.title}>{batch.name}</Text>
        <Text style={styles.meta}>
          {members.length}/{batch.capacity} athletes
          {batch.days ? ` · ${batch.days.split(',').join(' ').toUpperCase()}` : ''}
        </Text>

        {error ? <Banner kind="error">{error}</Banner> : null}
        {info ? <Banner kind="success">{info}</Banner> : null}

        <Text style={styles.section}>Today's Attendance</Text>
        {members.length === 0 ? (
          <Text style={styles.empty}>No athletes in this batch yet.</Text>
        ) : (
          members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{m.full_name || `Athlete #${m.id}`}</Text>
                <Pressable onPress={() => removeMember(m.id)} hitSlop={6}>
                  <Text style={styles.remove}>Remove from batch</Text>
                </Pressable>
              </View>
              <View style={styles.statusGroup}>
                {STATUSES.map(([val, lbl, color]) => {
                  const active = (statuses[m.id] || 'present') === val;
                  return (
                    <Pressable
                      key={val}
                      onPress={() => setStatuses((s) => ({ ...s, [m.id]: val }))}
                      style={[
                        styles.statusBtn,
                        { borderColor: color },
                        active && { backgroundColor: color },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: active ? theme.colors.primaryText : color },
                        ]}
                      >
                        {lbl}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {members.length > 0 && (
          <Button title="Save Attendance" onPress={onSaveAttendance} loading={saving} />
        )}

        <Text style={styles.section}>Members</Text>
        <Button
          title={showAdd ? 'Done adding' : '+ Add athlete to batch'}
          variant="ghost"
          onPress={() => setShowAdd((s) => !s)}
        />
        {showAdd &&
          (addable.length === 0 ? (
            <Text style={styles.empty}>All your athletes are already in this batch.</Text>
          ) : (
            addable.map((a) => (
              <Pressable key={a.id} style={styles.addRow} onPress={() => addMember(a.id)}>
                <Text style={styles.name}>{a.full_name || `Athlete #${a.id}`}</Text>
                <Text style={styles.addPlus}>+</Text>
              </Pressable>
            ))
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  meta: { color: theme.colors.textMuted, marginTop: 2, fontSize: 14 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: theme.spacing(1) },
  empty: { color: theme.colors.textMuted, marginVertical: 8 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 14,
    marginBottom: 8,
  },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  remove: { color: theme.colors.danger, fontSize: 11, marginTop: 4 },
  statusGroup: { flexDirection: 'row', gap: 6 },
  statusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontWeight: '800', fontSize: 13 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 14,
    marginBottom: 8,
  },
  addPlus: { color: theme.colors.primary, fontSize: 22, fontWeight: '800' },
});
