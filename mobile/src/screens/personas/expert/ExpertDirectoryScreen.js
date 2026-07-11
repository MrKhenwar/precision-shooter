import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getExpertDirectory } from '../../../api/personas';
import { theme } from '../../../theme';

const EXPERT_LABELS = {
  sc_coach: 'S&C Coach', physio: 'Physiotherapist', psychologist: 'Psychologist',
  consultant: 'Consultant Coach', yoga: 'Yoga Expert', dietician: 'Dietician',
};

export default function ExpertDirectoryScreen() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setExperts(await getExpertDirectory());
    } catch (_) { /* ignore */ } finally {
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
        {experts.length === 0 ? (
          <Text style={styles.empty}>No experts listed yet.</Text>
        ) : (
          experts.map((e) => (
            <View key={e.id} style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.name}>{e.full_name}</Text>
                <Text style={styles.type}>{EXPERT_LABELS[e.expert_type] || 'Expert'}</Text>
              </View>
              {e.degree ? <Text style={styles.meta}>{e.degree} · {e.experience_years} yrs</Text> : null}
              {e.service_history ? <Text style={styles.body}>{e.service_history}</Text> : null}
              {e.bio ? <Text style={styles.bio}>{e.bio}</Text> : null}
              <Text style={styles.book}>Booking (platform fees apply) — coming soon</Text>
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
  card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  type: { color: theme.colors.primary, fontWeight: '700', fontSize: 12 },
  meta: { color: theme.colors.textMuted, marginTop: 4, fontSize: 13 },
  body: { color: theme.colors.textMuted, marginTop: 6, fontSize: 13 },
  bio: { color: theme.colors.text, marginTop: 6, fontSize: 13 },
  book: { color: theme.colors.warning, marginTop: 10, fontSize: 12 },
});
