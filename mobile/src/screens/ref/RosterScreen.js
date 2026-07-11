// Coach roster — live list of linked athletes. Tapping a row opens the
// athlete profile (reference screen 4).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, Loading } from '../../components/kit';
import { useFetch } from './useFetch';
import { DISCIPLINE, TIER, label } from './labels';
import { getRoster } from '../../api/coach';
import { theme } from '../../theme';

export default function RosterScreen({ navigation }) {
  const { data, loading } = useFetch({ roster: getRoster });
  const roster = data.roster || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Athletes</Text>
      </View>
      {loading ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {roster.length === 0 ? (
            <EmptyState icon="people-outline" title="No athletes yet" sub="Approved link requests will appear here." />
          ) : (
            roster.map((a) => (
              <Pressable
                key={a.id}
                style={styles.row}
                onPress={() => navigation.navigate('AthleteProfile', {
                  athleteId: a.id,
                  name: a.full_name,
                  discipline: a.discipline,
                  tier: a.current_tier,
                })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(a.full_name)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{a.full_name}</Text>
                  <Text style={styles.sub}>{label(DISCIPLINE, a.discipline)}</Text>
                </View>
                <Badge label={label(TIER, a.current_tier)} color={theme.colors.gold} />
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} style={{ marginLeft: 8 }} />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1.5) },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  content: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(4) },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.colors.primary, fontWeight: '800', fontSize: 15 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
});
