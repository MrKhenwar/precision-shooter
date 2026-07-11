import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { createFee, getFees, updateFee } from '../../../api/academy';
import { getRoster } from '../../../api/coach';
import { Banner, Button, Field } from '../../../components/ui';
import { Dropdown, monthOptions } from '../../../components/Dropdown';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { theme } from '../../../theme';

const STATUS = [
  ['paid', theme.colors.success],
  ['pending', theme.colors.warning],
  ['overdue', theme.colors.danger],
];
const MONTHS = monthOptions();

export default function FeesScreen() {
  const [fees, setFees] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [athleteId, setAthleteId] = useState(null);
  const [period, setPeriod] = useState(MONTHS[0]?.value || '');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [f, r] = await Promise.all([getFees(), getRoster()]);
      setFees(f);
      setRoster(r);
    } catch (_) { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const athleteOptions = roster.map((a) => ({
    value: a.id,
    label: a.full_name || `Athlete #${a.id}`,
  }));

  async function onCreate() {
    setError(null);
    if (!athleteId) { setError('Please choose an athlete.'); return; }
    if (!period) { setError('Please choose a billing month.'); return; }
    if (!amount || isNaN(parseFloat(amount))) { setError('Please enter a valid amount.'); return; }
    setSaving(true);
    try {
      await createFee({ athlete: athleteId, period, amount, status: 'pending' });
      setAthleteId(null);
      setPeriod(MONTHS[0]?.value || '');
      setAmount('');
      setShowForm(false);
      await load();
    } catch (e) {
      const d = e.response?.data;
      setError(d?.detail || (d ? Object.values(d).flat().join(' ') : 'Could not create fee.'));
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(fee) {
    const order = ['pending', 'paid', 'overdue'];
    const next = order[(order.indexOf(fee.status) + 1) % order.length];
    const patch = { status: next };
    if (next === 'paid') patch.paid_on = new Date().toISOString().slice(0, 10);
    try {
      const updated = await updateFee(fee.id, patch);
      setFees((fs) => fs.map((f) => (f.id === fee.id ? updated : f)));
    } catch (_) { /* ignore */ }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <KeyboardScreen>
      <Button
        title={showForm ? 'Cancel' : '+ Raise a Fee'}
        variant={showForm ? 'ghost' : 'primary'}
        onPress={() => setShowForm((s) => !s)}
      />
      {showForm && (
        <View style={styles.form}>
          {error ? <Banner kind="error">{error}</Banner> : null}
          {roster.length === 0 ? (
            <Text style={styles.hint}>You have no linked athletes yet.</Text>
          ) : (
            <Dropdown
              label="Athlete"
              value={athleteId}
              options={athleteOptions}
              onChange={setAthleteId}
              placeholder="Choose an athlete"
            />
          )}
          <Dropdown label="Billing month" value={period} options={MONTHS} onChange={setPeriod} />
          <Field label="Amount (₹)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="500" />
          <Button title="Create Fee" onPress={onCreate} loading={saving} />
        </View>
      )}

      <Text style={styles.section}>Fee records</Text>
      <Text style={styles.hint}>Tap a status pill to cycle Pending → Paid → Overdue.</Text>
      {fees.length === 0 ? (
        <Text style={styles.empty}>No fees raised yet.</Text>
      ) : (
        fees.map((f) => {
          const color = (STATUS.find(([s]) => s === f.status) || STATUS[1])[1];
          return (
            <View key={f.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{f.athlete_name || `Athlete #${f.athlete}`}</Text>
                <Text style={styles.meta}>{f.period} · ₹{f.amount}</Text>
              </View>
              <Pressable onPress={() => cycleStatus(f)} style={[styles.statusPill, { borderColor: color }]}>
                <Text style={[styles.statusText, { color }]}>{f.status}</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  form: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginTop: theme.spacing(2) },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: 4 },
  hint: { color: theme.colors.textMuted, fontSize: 12, marginBottom: theme.spacing(1) },
  empty: { color: theme.colors.textMuted },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginBottom: 10 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13 },
  statusPill: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontWeight: '800', fontSize: 12, textTransform: 'capitalize' },
});
