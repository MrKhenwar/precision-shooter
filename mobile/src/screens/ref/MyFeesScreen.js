// Athlete fees — list own fee records and pay outstanding dues (simulated).
import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, EmptyState, Header, Loading } from '../../components/kit';
import { fmtDate, money } from './labels';
import { getMyFees, payMyFee } from '../../api/academy';
import { theme } from '../../theme';

const STATUS = {
  paid: { color: theme.colors.success, label: 'Paid' },
  pending: { color: theme.colors.warning, label: 'Pending' },
  overdue: { color: theme.colors.danger, label: 'Overdue' },
};

export default function MyFeesScreen({ navigation }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pay, setPay] = useState(null); // fee being paid
  const [method, setMethod] = useState('upi');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getMyFees().then(setFees).catch(() => setFees([])).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  async function confirmPay() {
    if (!pay) return;
    setBusy(true);
    try {
      const updated = await payMyFee(pay.id);
      setFees((fs) => fs.map((f) => (f.id === updated.id ? updated : f)));
      setPay(null);
    } catch {} finally { setBusy(false); }
  }

  const dueTotal = fees.filter((f) => f.status !== 'paid').reduce((t, f) => t + parseFloat(f.amount || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="My Fees" onLeft={() => navigation.goBack()} />
      {loading ? <Loading /> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Outstanding</Text>
            <Text style={styles.totalValue}>{money(dueTotal)}</Text>
          </View>

          {fees.length === 0 ? (
            <EmptyState icon="card-outline" title="No fee records" sub="Fees raised by your coach appear here." />
          ) : fees.map((f) => {
            const st = STATUS[f.status] || STATUS.pending;
            const paid = f.status === 'paid';
            return (
              <View key={f.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.period}>{f.period || 'Fee'}</Text>
                    <Text style={styles.sub}>{paid && f.paid_on ? `Paid ${fmtDate(f.paid_on)}` : `Due ${fmtDate(f.due_date)}`}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amount}>{money(f.amount)}</Text>
                    <View style={{ marginTop: 6 }}><Badge label={st.label} color={st.color} /></View>
                  </View>
                </View>
                {!paid ? <Button title="Pay Now" icon="card" style={{ marginTop: 12 }} onPress={() => { setPay(f); setMethod('upi'); }} /> : null}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Payment sheet */}
      <Modal visible={!!pay} transparent animationType="slide" onRequestClose={() => setPay(null)}>
        <Pressable style={styles.backdrop} onPress={() => !busy && setPay(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Pay {money(pay?.amount)}</Text>
          <Text style={styles.sheetSub}>{pay?.period}</Text>
          <Text style={styles.methodLabel}>Payment Method</Text>
          {[
            { k: 'upi', label: 'UPI', icon: 'phone-portrait' },
            { k: 'card', label: 'Credit / Debit Card', icon: 'card' },
            { k: 'netbanking', label: 'Net Banking', icon: 'business' },
          ].map((m) => (
            <Pressable key={m.k} style={[styles.method, method === m.k && styles.methodOn]} onPress={() => setMethod(m.k)}>
              <Ionicons name={m.icon} size={20} color={method === m.k ? theme.colors.primary : theme.colors.textMuted} />
              <Text style={[styles.methodText, method === m.k && { color: theme.colors.text }]}>{m.label}</Text>
              <Ionicons name={method === m.k ? 'radio-button-on' : 'radio-button-off'} size={20} color={method === m.k ? theme.colors.primary : theme.colors.textFaint} />
            </Pressable>
          ))}
          <Button title={`Pay ${money(pay?.amount)}`} loading={busy} onPress={confirmPay} style={{ marginTop: 16 }} />
          <Button title="Cancel" variant="ghost" disabled={busy} onPress={() => setPay(null)} style={{ marginTop: 10 }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  totalCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 20, alignItems: 'center', marginBottom: 16 },
  totalLabel: { color: theme.colors.textMuted, fontSize: 13 },
  totalValue: { color: theme.colors.primary, fontSize: 32, fontWeight: '800', marginTop: 6 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  period: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  sub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
  amount: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: theme.spacing(3), paddingBottom: theme.spacing(5), borderWidth: 1, borderColor: theme.colors.border },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: theme.colors.border, marginBottom: 16 },
  sheetTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  sheetSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 3 },
  methodLabel: { color: theme.colors.textMuted, fontSize: 13, marginTop: 20, marginBottom: 10 },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radiusSm, padding: 14, marginBottom: 10 },
  methodOn: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryDim },
  methodText: { flex: 1, color: theme.colors.textMuted, fontSize: 15, fontWeight: '600' },
});
