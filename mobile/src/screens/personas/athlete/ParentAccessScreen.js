import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getParentRequests, respondParentRequest } from '../../../api/personas';
import { Banner, Button } from '../../../components/ui';
import { theme } from '../../../theme';

export default function ParentAccessScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [info, setInfo] = useState(null);

  const load = useCallback(async () => {
    try {
      setRequests(await getParentRequests());
    } catch (_) { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function respond(id, action) {
    setBusyId(id);
    setInfo(null);
    try {
      const res = await respondParentRequest(id, action);
      setInfo(res.message);
      setRequests((rs) => rs.filter((r) => r.id !== id));
    } catch (_) { /* ignore */ } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={{ padding: theme.spacing(2) }}>
        <Text style={styles.intro}>Approve a parent to give them read-only access to your attendance, evaluations and diary.</Text>
        {info ? <Banner kind="success">{info}</Banner> : null}
        {requests.length === 0 ? (
          <Text style={styles.empty}>No pending parent requests.</Text>
        ) : (
          requests.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.name}>{r.parent_name}</Text>
              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <Button title="Approve" loading={busyId === r.id} onPress={() => respond(r.id, 'approve')} />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Button title="Reject" variant="ghost" disabled={busyId === r.id} onPress={() => respond(r.id, 'reject')} />
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  intro: { color: theme.colors.textMuted, fontSize: 13, marginBottom: theme.spacing(2), lineHeight: 19 },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginBottom: 12 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', marginTop: 12 },
});
