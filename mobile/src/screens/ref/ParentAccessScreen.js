// Athlete approves/rejects parent read-only access requests.
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, EmptyState, Header, Loading } from '../../components/kit';
import { getParentRequests, respondParentRequest } from '../../api/personas';
import { theme } from '../../theme';

export default function ParentAccessScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [info, setInfo] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getParentRequests().then(setRequests).catch(() => setRequests([])).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  async function respond(id, action) {
    setBusyId(id); setInfo(null);
    try {
      const res = await respondParentRequest(id, action);
      setInfo(res.message || `Request ${action}d.`);
      setRequests((rs) => rs.filter((r) => r.id !== id));
    } catch {} finally { setBusyId(null); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Parent Access" onLeft={() => navigation.goBack()} />
      {loading ? <Loading /> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>Approve a parent to give them read-only access to your attendance, evaluations and diary.</Text>
          {info ? <Banner kind="success">{info}</Banner> : null}
          {requests.length === 0 ? (
            <EmptyState icon="people-outline" title="No pending requests" sub="Parent access requests appear here." />
          ) : requests.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.name}>{r.parent_name || `Parent #${r.parent}`}</Text>
              <View style={styles.actions}>
                <Button title="Approve" style={{ flex: 1 }} loading={busyId === r.id} onPress={() => respond(r.id, 'approve')} />
                <Button title="Reject" variant="ghost" style={{ flex: 1 }} disabled={busyId === r.id} onPress={() => respond(r.id, 'reject')} />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  intro: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: theme.spacing(2) },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
