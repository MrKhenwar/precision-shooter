import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getMyEvaluations } from '../../../api/performance';
import { EvaluationCard } from '../../../components/EvaluationCard';
import { theme } from '../../../theme';

export default function MyEvaluationsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await getMyEvaluations());
    } catch (_) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
        {items.length === 0 ? (
          <Text style={styles.empty}>No evaluations yet. Your coach will add these.</Text>
        ) : (
          items.map((e) => <EvaluationCard key={e.id} e={e} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
});
