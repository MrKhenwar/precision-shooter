import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { listMyLinkRequests, requestCoachLink } from '../../../api/athlete';
import { Banner, Button, Field } from '../../../components/ui';
import { theme } from '../../../theme';

const STATUS_STYLE = {
  pending: { color: theme.colors.warning, text: 'Pending' },
  approved: { color: theme.colors.success, text: 'Approved' },
  rejected: { color: theme.colors.danger, text: 'Rejected' },
};

export default function ConnectCoachScreen() {
  const [mobile, setMobile] = useState('');
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setRequests(await listMyLinkRequests());
    } catch (_) {
      /* ignore transient load errors */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onSend() {
    setError(null);
    setInfo(null);
    if (!mobile.trim()) {
      setError("Enter your coach's mobile number.");
      return;
    }
    setSending(true);
    try {
      const res = await requestCoachLink(mobile.trim());
      setInfo(res.already_pending ? 'Request already pending for this coach.' : res.message);
      setMobile('');
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not send the request.');
    } finally {
      setSending(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: theme.spacing(2) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <Text style={styles.intro}>
          Enter your coach's registered mobile number. They'll get a request to
          approve — once accepted, your profile links to them and your plan moves
          to the coached tier.
        </Text>

        {error ? <Banner kind="error">{error}</Banner> : null}
        {info ? <Banner kind="success">{info}</Banner> : null}

        <Field
          label="Coach Mobile Number"
          placeholder="9990001111"
          keyboardType="phone-pad"
          value={mobile}
          onChangeText={setMobile}
        />
        <Button title="Send Request" onPress={onSend} loading={sending} />

        <Text style={styles.section}>Your requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.empty}>No requests yet.</Text>
        ) : (
          requests.map((r) => {
            const s = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
            return (
              <View key={r.id} style={styles.requestRow}>
                <Text style={styles.requestText}>Coach #{r.coach}</Text>
                <Text style={[styles.status, { color: s.color, borderColor: s.color }]}>
                  {s.text}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  intro: { color: theme.colors.textMuted, fontSize: 13, marginBottom: theme.spacing(2), lineHeight: 19 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: theme.spacing(1) },
  empty: { color: theme.colors.textMuted },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 14,
    marginBottom: 8,
  },
  requestText: { color: theme.colors.text, fontWeight: '600' },
  status: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '700',
  },
});
