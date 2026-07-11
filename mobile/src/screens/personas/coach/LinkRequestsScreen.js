import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getPendingLinks, respondLink } from '../../../api/coach';
import { Banner, Button } from '../../../components/ui';
import { theme } from '../../../theme';

export default function LinkRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const load = useCallback(async () => {
    try {
      setRequests(await getPendingLinks());
      setError(null);
    } catch (_) {
      setError('Could not load requests.');
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

  async function respond(id, action) {
    setBusyId(id);
    setInfo(null);
    setError(null);
    try {
      const res = await respondLink(id, action);
      setInfo(res.message);
      setRequests((rs) => rs.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.response?.data?.detail || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing(2) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {error ? <Banner kind="error">{error}</Banner> : null}
        {info ? <Banner kind="success">{info}</Banner> : null}

        {requests.length === 0 ? (
          <Text style={styles.empty}>No pending requests. Pull down to refresh.</Text>
        ) : (
          requests.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.name}>{r.athlete_name || `Athlete #${r.athlete}`}</Text>
              {r.athlete_discipline ? (
                <Text style={styles.meta}>{r.athlete_discipline.replace('_', ' ')}</Text>
              ) : null}
              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Approve"
                    loading={busyId === r.id}
                    onPress={() => respond(r.id, 'approve')}
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Button
                    title="Reject"
                    variant="ghost"
                    disabled={busyId === r.id}
                    onPress={() => respond(r.id, 'reject')}
                  />
                </View>
              </View>
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
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    marginBottom: 12,
  },
  name: { color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13, textTransform: 'capitalize' },
  actions: { flexDirection: 'row', marginTop: 14 },
});
