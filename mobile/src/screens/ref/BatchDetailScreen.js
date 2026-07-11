// Coach batch detail — view members, mark today's attendance, add athletes.
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, EmptyState, Header, Loading } from '../../components/kit';
import { DISCIPLINE, label } from './labels';
import { addBatchMember, getBatchAttendance, getBatchMembers, getRoster, markBatchAttendance } from '../../api/coach';
import { theme } from '../../theme';

const STATUSES = [
  { k: 'present', label: 'Present', color: theme.colors.success },
  { k: 'absent', label: 'Absent', color: theme.colors.danger },
  { k: 'late', label: 'Late', color: theme.colors.warning },
];

export default function BatchDetailScreen({ navigation, route }) {
  const batch = route.params?.batch || {};
  const today = new Date().toISOString().slice(0, 10);
  const [members, setMembers] = useState([]);
  const [roster, setRoster] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getBatchMembers(batch.id).catch(() => []),
      getRoster().catch(() => []),
      getBatchAttendance(batch.id, today).catch(() => ({ records: [] })),
    ]).then(([mem, ros, att]) => {
      setMembers(mem || []);
      setRoster(ros || []);
      const init = {};
      (att?.records || []).forEach((r) => { init[r.athlete] = r.status; });
      setStatuses(init);
      setLoading(false);
    });
  }, [batch.id]);
  useFocusEffect(load);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const entries = members.map((m) => ({ athlete_id: m.id, status: statuses[m.id] || 'present' }));
      const res = await markBatchAttendance(batch.id, entries, today);
      setMsg({ kind: 'success', text: res.message || 'Attendance saved.' });
    } catch (e) {
      setMsg({ kind: 'error', text: e.response?.data?.detail || 'Could not save.' });
    } finally { setSaving(false); }
  }

  async function add(athleteId) {
    try { await addBatchMember(batch.id, athleteId); load(); } catch {}
  }

  const memberIds = new Set(members.map((m) => m.id));
  const addable = roster.filter((r) => !memberIds.has(r.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={batch.name || 'Batch'} onLeft={() => navigation.goBack()} right={showAdd ? 'close' : 'person-add'} onRight={() => setShowAdd((s) => !s)} />
      {loading ? <Loading /> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {msg ? <Banner kind={msg.kind}>{msg.text}</Banner> : null}

          {showAdd && (
            <View style={styles.addBox}>
              <Text style={styles.addTitle}>Add Athlete</Text>
              {addable.length === 0 ? <Text style={styles.dim}>All your athletes are already in this batch.</Text> : addable.map((a) => (
                <Pressable key={a.id} style={styles.addRow} onPress={() => add(a.id)}>
                  <Text style={styles.addName}>{a.full_name}</Text>
                  <Ionicons name="add-circle" size={22} color={theme.colors.primary} />
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.section}>Mark Attendance · Today</Text>
          {members.length === 0 ? (
            <EmptyState icon="people-outline" title="No members" sub="Add athletes to this batch." />
          ) : (
            <>
              {members.map((m) => (
                <View key={m.id} style={styles.memberCard}>
                  <View style={styles.memberTop}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{initials(m.full_name)}</Text></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.name}>{m.full_name}</Text>
                      <Text style={styles.sub}>{label(DISCIPLINE, m.discipline)}</Text>
                    </View>
                  </View>
                  <View style={styles.pills}>
                    {STATUSES.map((s) => {
                      const on = (statuses[m.id] || 'present') === s.k;
                      return (
                        <Pressable key={s.k} onPress={() => setStatuses((st) => ({ ...st, [m.id]: s.k }))} style={[styles.pill, on && { backgroundColor: s.color, borderColor: s.color }]}>
                          <Text style={[styles.pillText, on && { color: '#fff' }]}>{s.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
              <Button title="Save Attendance" icon="checkmark-done" onPress={save} loading={saving} style={{ marginTop: 6 }} />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function initials(name = '') { return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(); }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: theme.spacing(1.5), marginTop: theme.spacing(1) },
  addBox: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 16 },
  addTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  dim: { color: theme.colors.textMuted, fontSize: 13 },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSoft },
  addName: { color: theme.colors.text, fontSize: 15 },
  memberCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 12 },
  memberTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  pills: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border },
  pillText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
});
