import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getRoster } from '../../../api/coach';
import { Field } from '../../../components/ui';
import { OPTIONS, TIER_LABELS } from '../../../components/Select';
import { theme } from '../../../theme';

const DISCIPLINE_LABEL = Object.fromEntries(OPTIONS.discipline.map((o) => [o.value, o.label]));

export default function RosterScreen({ navigation }) {
  const [roster, setRoster] = useState([]);
  const [query, setQuery] = useState('');
  const [discFilter, setDiscFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setRoster(await getRoster());
    } catch (_) {
      /* ignore */
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster.filter((a) => {
      if (discFilter && a.discipline !== discFilter) return false;
      if (q && !(a.full_name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [roster, query, discFilter]);

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
      <View style={{ padding: theme.spacing(2), paddingBottom: 0 }}>
        <Field placeholder="Search by name" value={query} onChangeText={setQuery} />
        <View style={styles.filterRow}>
          <FilterChip label="All" active={!discFilter} onPress={() => setDiscFilter(null)} />
          {OPTIONS.discipline.map((d) => (
            <FilterChip
              key={d.value}
              label={d.label}
              active={discFilter === d.value}
              onPress={() => setDiscFilter(d.value)}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing(2) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No athletes match. Pull down to refresh.</Text>
        ) : (
          filtered.map((a) => (
            <Pressable
              key={a.id}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('AthleteDetail', { athlete: a })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{a.full_name || `Athlete #${a.id}`}</Text>
                <Text style={styles.meta}>
                  {(DISCIPLINE_LABEL[a.discipline] || '—')} · {a.age_category || '—'}
                </Text>
              </View>
              <Text style={styles.tier}>{TIER_LABELS[a.current_tier] || a.current_tier}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing(1) },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: theme.colors.primaryText },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    marginBottom: 10,
  },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13 },
  tier: { color: theme.colors.primary, fontWeight: '700', fontSize: 13, marginLeft: 8 },
});
