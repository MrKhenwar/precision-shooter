import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getMyFees } from '../../../api/academy';
import { theme } from '../../../theme';

const STATUS_COLOR = {
  paid: theme.colors.success,
  pending: theme.colors.warning,
  overdue: theme.colors.danger,
};

export default function MyFeesScreen() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setFees(await getMyFees());
    } catch (_) { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  const dues = fees.filter((f) => f.status !== 'paid').length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
        <View style={styles.summary}>
          <Text style={styles.summaryValue}>{dues}</Text>
          <Text style={styles.summaryLabel}>open due{dues === 1 ? '' : 's'}</Text>
        </View>

        {fees.length === 0 ? (
          <Text style={styles.empty}>No fee records yet.</Text>
        ) : (
          fees.map((f) => (
            <View key={f.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.period}>{f.period}</Text>
                <Text style={styles.amount}>₹{f.amount}{f.due_date ? ` · due ${f.due_date}` : ''}</Text>
              </View>
              <Text style={[styles.status, { color: STATUS_COLOR[f.status] || theme.colors.text, borderColor: STATUS_COLOR[f.status] || theme.colors.border }]}>
                {f.status}
              </Text>
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
  summary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 20, alignItems: 'center', marginBottom: theme.spacing(2) },
  summaryValue: { color: theme.colors.primary, fontSize: 36, fontWeight: '800' },
  summaryLabel: { color: theme.colors.textMuted, marginTop: 2 },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginBottom: 10 },
  period: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  amount: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13 },
  status: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, fontWeight: '800', fontSize: 12, textTransform: 'capitalize' },
});
