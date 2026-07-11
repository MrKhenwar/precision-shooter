// Coach fees — outstanding total, raise a new fee, and mark fees paid.
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Banner, Button, EmptyState, Field, Header, Loading } from '../../components/kit';
import { fmtDate, money } from './labels';
import { createFee, getFees, updateFee } from '../../api/academy';
import { getRoster } from '../../api/coach';
import { theme } from '../../theme';

const STATUS = {
  paid: { color: theme.colors.success, label: 'Paid' },
  pending: { color: theme.colors.warning, label: 'Pending' },
  overdue: { color: theme.colors.danger, label: 'Overdue' },
};

export default function FeesScreen({ navigation }) {
  const [fees, setFees] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [athleteId, setAthleteId] = useState(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getFees().catch(() => []), getRoster().catch(() => [])]).then(([f, r]) => {
      setFees(f || []); setRoster(r || []); setLoading(false);
    });
  }, []);
  useFocusEffect(load);

  async function raise() {
    setError(null);
    if (!athleteId) return setError('Select an athlete.');
    if (!amount) return setError('Enter an amount.');
    setSaving(true);
    try {
      await createFee({ athlete: athleteId, period, amount, status: 'pending' });
      setShow(false); setAthleteId(null); setAmount('');
      load();
    } catch (e) { setError(e.response?.data?.detail || 'Could not raise fee.'); }
    finally { setSaving(false); }
  }

  async function markPaid(f) {
    try {
      const updated = await updateFee(f.id, { status: 'paid', paid_on: new Date().toISOString().slice(0, 10) });
      setFees((fs) => fs.map((x) => (x.id === f.id ? { ...x, ...updated } : x)));
    } catch {}
  }

  const dueTotal = fees.filter((f) => f.status !== 'paid').reduce((t, f) => t + parseFloat(f.amount || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Fees" onLeft={() => navigation.goBack()} right={show ? 'close' : 'add'} onRight={() => setShow((s) => !s)} />
      {loading ? <Loading /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {show && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Raise Fee</Text>
                {error ? <Banner kind="error">{error}</Banner> : null}
                <Text style={styles.label}>Athlete</Text>
                <View style={styles.pickerWrap}>
                  {roster.length === 0 ? <Text style={styles.dim}>No athletes on your roster.</Text> : roster.map((a) => (
                    <Pressable key={a.id} onPress={() => setAthleteId(a.id)} style={[styles.pick, athleteId === a.id && styles.pickOn]}>
                      <Text style={[styles.pickText, athleteId === a.id && { color: '#fff' }]}>{a.full_name}</Text>
                    </Pressable>
                  ))}
                </View>
                <Field label="Period (YYYY-MM)" value={period} onChangeText={setPeriod} autoCapitalize="none" />
                <Field label="Amount (₹)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
                <Button title="Raise Fee" icon="add-circle" onPress={raise} loading={saving} />
              </View>
            )}

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Outstanding</Text>
              <Text style={styles.totalValue}>{money(dueTotal)}</Text>
            </View>

            {fees.length === 0 && !show ? (
              <EmptyState icon="card-outline" title="No fee records" sub="Tap + to raise a fee." />
            ) : fees.map((f) => {
              const st = STATUS[f.status] || STATUS.pending;
              const paid = f.status === 'paid';
              return (
                <View key={f.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{f.athlete_name || 'Athlete'}</Text>
                      <Text style={styles.sub}>{f.period} · {paid && f.paid_on ? `Paid ${fmtDate(f.paid_on)}` : `Due ${fmtDate(f.due_date)}`}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amount}>{money(f.amount)}</Text>
                      <View style={{ marginTop: 6 }}><Badge label={st.label} color={st.color} /></View>
                    </View>
                  </View>
                  {!paid ? <Button title="Mark as Paid" variant="ghost" icon="checkmark" style={{ marginTop: 12 }} onPress={() => markPaid(f)} /> : null}
                </View>
              );
            })}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  form: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 16 },
  formTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  label: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 8 },
  dim: { color: theme.colors.textMuted, fontSize: 13 },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pick: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pickOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pickText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  totalCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 18, marginBottom: 14 },
  totalLabel: { color: theme.colors.textMuted, fontSize: 13 },
  totalValue: { color: theme.colors.danger, fontSize: 26, fontWeight: '800', marginTop: 6 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
  amount: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
});
