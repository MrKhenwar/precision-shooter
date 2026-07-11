import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setAthleteTier } from '../../../api/coach';
import { Banner, Button } from '../../../components/ui';
import { Select, TIER_LABELS } from '../../../components/Select';
import { theme } from '../../../theme';

const TIER_OPTIONS = Object.entries(TIER_LABELS).map(([value, label]) => ({ value, label }));

export default function AthleteDetailScreen({ route, navigation }) {
  const { athlete } = route.params;
  const [tier, setTier] = useState(athlete.current_tier);
  const [saved, setSaved] = useState(athlete.current_tier);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setError(null);
    setInfo(null);
    setSaving(true);
    try {
      const res = await setAthleteTier(athlete.id, tier);
      setSaved(res.current_tier);
      setInfo('Tier updated.');
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not update tier.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
        <Text style={styles.name}>{athlete.full_name || `Athlete #${athlete.id}`}</Text>
        <Text style={styles.meta}>
          {(athlete.discipline || '—').replace('_', ' ')} · {athlete.age_category || '—'}
        </Text>

        <View style={styles.tierCard}>
          <Text style={styles.tierLabel}>Current Tier</Text>
          <Text style={styles.tierValue}>{TIER_LABELS[saved] || saved}</Text>
        </View>

        {error ? <Banner kind="error">{error}</Banner> : null}
        {info ? <Banner kind="success">{info}</Banner> : null}

        <Text style={styles.section}>Update Tier</Text>
        <Text style={styles.note}>
          Foundation tiers (Rookie→Sharpshooter) then competitive qualification tiers.
        </Text>
        <Select value={tier} options={TIER_OPTIONS} onChange={setTier} />

        <Button
          title="Save Tier"
          onPress={onSave}
          loading={saving}
          disabled={tier === saved}
        />

        <View style={{ height: 12 }} />
        <Button
          title="View Performance & Evaluate"
          variant="ghost"
          onPress={() => navigation.navigate('AthletePerformance', { athlete })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  meta: { color: theme.colors.textMuted, marginTop: 2, fontSize: 14, textTransform: 'capitalize' },
  tierCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  tierLabel: { color: theme.colors.textMuted, fontSize: 12 },
  tierValue: { color: theme.colors.primary, fontSize: 22, fontWeight: '800', marginTop: 2 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  note: { color: theme.colors.textMuted, fontSize: 12, marginBottom: theme.spacing(1) },
});
