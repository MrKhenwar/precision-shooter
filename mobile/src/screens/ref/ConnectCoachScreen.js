// Athlete → request to link with a coach by mobile number; shows request status.
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Banner, Button, EmptyState, Field, Header } from '../../components/kit';
import { listMyLinkRequests, requestCoachLink } from '../../api/athlete';
import { theme } from '../../theme';

const STATUS = {
  pending: theme.colors.warning,
  approved: theme.colors.success,
  rejected: theme.colors.danger,
};

export default function ConnectCoachScreen({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    listMyLinkRequests().then(setRequests).catch(() => {});
  }, []);
  useFocusEffect(load);

  async function onSend() {
    setError(null); setInfo(null);
    if (!mobile.trim()) return setError("Enter your coach's mobile number.");
    setSending(true);
    try {
      const res = await requestCoachLink(mobile.trim());
      setInfo(res.already_pending ? 'Request already pending for this coach.' : (res.message || 'Request sent.'));
      setMobile('');
      load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not send the request.');
    } finally { setSending(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Connect a Coach" onLeft={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>Enter your coach's registered mobile number. Once they approve, your profile links to them and your plan moves to the coached tier.</Text>
          {error ? <Banner kind="error">{error}</Banner> : null}
          {info ? <Banner kind="success">{info}</Banner> : null}
          <Field label="Coach Mobile Number" placeholder="9990001111" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} />
          <Button title="Send Request" icon="send" onPress={onSend} loading={sending} />

          <Text style={styles.section}>Your requests</Text>
          {requests.length === 0 ? (
            <EmptyState icon="person-add-outline" title="No requests yet" sub="Coach link requests appear here." />
          ) : requests.map((r) => (
            <View key={r.id} style={styles.row}>
              <Text style={styles.rowText}>Coach #{r.coach}</Text>
              <Badge label={cap(r.status)} color={STATUS[r.status] || theme.colors.textMuted} />
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2) },
  intro: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: theme.spacing(2) },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: theme.spacing(1.5) },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius, padding: 16, marginBottom: 10 },
  rowText: { color: theme.colors.text, fontWeight: '600', fontSize: 15 },
});
