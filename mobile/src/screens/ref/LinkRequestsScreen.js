// Coach approves/rejects athlete link requests.
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, EmptyState, Header, Loading } from '../../components/kit';
import { DISCIPLINE, label, timeAgo } from './labels';
import { getPendingLinks, respondLink } from '../../api/coach';
import { theme } from '../../theme';

export default function LinkRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getPendingLinks().then(setRequests).catch(() => setRequests([])).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  async function respond(id, action) {
    setBusyId(id); setMsg(null);
    try {
      const res = await respondLink(id, action);
      setMsg({ kind: 'success', text: res.message || `Request ${action}d.` });
      setRequests((rs) => rs.filter((r) => r.id !== id));
    } catch (e) {
      setMsg({ kind: 'error', text: e.response?.data?.detail || 'Action failed.' });
    } finally { setBusyId(null); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Link Requests" onLeft={() => navigation.goBack()} />
      {loading ? <Loading /> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {msg ? <Banner kind={msg.kind}>{msg.text}</Banner> : null}
          {requests.length === 0 ? (
            <EmptyState icon="person-add-outline" title="No pending requests" sub="Athlete requests to join appear here." />
          ) : requests.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.head}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials(r.athlete_name)}</Text></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{r.athlete_name}</Text>
                  <Text style={styles.sub}>{label(DISCIPLINE, r.athlete_discipline)} · {timeAgo(r.requested_at)}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Button title="Approve" icon="checkmark" style={{ flex: 1 }} loading={busyId === r.id} onPress={() => respond(r.id, 'approve')} />
                <Button title="Reject" variant="ghost" style={{ flex: 1 }} disabled={busyId === r.id} onPress={() => respond(r.id, 'reject')} />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function initials(name = '') { return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(); }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.colors.primary, fontWeight: '800', fontSize: 15 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  sub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
