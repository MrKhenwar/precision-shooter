import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyProfile, updateMyProfile } from '../../../api/athlete';
import { getMyFees } from '../../../api/academy';
import { Banner, Button, Field } from '../../../components/ui';
import { OPTIONS, Select, TIER_LABELS } from '../../../components/Select';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { theme } from '../../../theme';

const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function ProfileScreen({ navigation }) {
  const [form, setForm] = useState(null);
  const [tier, setTier] = useState('rookie');
  const [ageCategory, setAgeCategory] = useState('');
  const [duesTotal, setDuesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        getMyFees()
          .then((fees) => setDuesTotal(
            (fees || []).filter((f) => f.status !== 'paid').reduce((t, f) => t + parseFloat(f.amount || 0), 0)
          ))
          .catch(() => {});
        const p = await getMyProfile();
        setForm({
          shooting_assoc_id: p.shooting_assoc_id || '',
          dob: p.dob || '',
          gender: p.gender || '',
          state: p.state || '',
          discipline: p.discipline || '',
          dominant_hand: p.dominant_hand || '',
          dominant_eye: p.dominant_eye || '',
          diet_type: p.diet_type || '',
        });
        setTier(p.current_tier);
        setAgeCategory(p.age_category);
      } catch (e) {
        setError('Could not load your profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  async function onSave() {
    setError(null);
    if (form.dob && !DOB_RE.test(form.dob)) {
      setError('Date of birth must be in YYYY-MM-DD format.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMyProfile(form);
      setAgeCategory(updated.age_category);
      setSaved(true);
    } catch (e) {
      const d = e.response?.data;
      setError(
        d?.detail ||
          (d && typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Save failed.')
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardScreen>
        {error ? <Banner kind="error">{error}</Banner> : null}
        {saved ? <Banner kind="success">Profile saved.</Banner> : null}

        <View style={styles.tierCard}>
          <View>
            <Text style={styles.tierLabel}>Current Tier</Text>
            <Text style={styles.tierValue}>{TIER_LABELS[tier] || tier}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.tierLabel}>Age Category</Text>
            <Text style={styles.tierValue}>{ageCategory || '—'}</Text>
          </View>
        </View>
        <Text style={styles.note}>
          Tier is set by your coach and updates as you progress.
        </Text>

        <View style={[styles.feesRow, { borderColor: duesTotal > 0 ? theme.colors.danger : theme.colors.success }]}>
          <Text style={styles.feesLabel}>Fees remaining</Text>
          <Text style={[styles.feesValue, { color: duesTotal > 0 ? theme.colors.danger : theme.colors.success }]}>
            {duesTotal > 0 ? `₹${duesTotal}` : 'All clear ✓'}
          </Text>
        </View>

        <Field
          label="Shooting Association ID (optional)"
          value={form.shooting_assoc_id}
          onChangeText={set('shooting_assoc_id')}
        />
        <Field
          label="Date of Birth (YYYY-MM-DD)"
          placeholder="2010-05-01"
          value={form.dob}
          onChangeText={set('dob')}
        />
        <Select label="Gender" value={form.gender} options={OPTIONS.gender} onChange={set('gender')} />
        <Field label="State" value={form.state} onChangeText={set('state')} />
        <Select
          label="Discipline"
          value={form.discipline}
          options={OPTIONS.discipline}
          onChange={set('discipline')}
        />
        <Select
          label="Dominant Hand"
          value={form.dominant_hand}
          options={OPTIONS.dominant_hand}
          onChange={set('dominant_hand')}
        />
        <Select
          label="Dominant Eye"
          value={form.dominant_eye}
          options={OPTIONS.dominant_eye}
          onChange={set('dominant_eye')}
        />
        <Select
          label="Diet Type"
          value={form.diet_type}
          options={OPTIONS.diet_type}
          onChange={set('diet_type')}
        />

        <Button title="Save Profile" onPress={onSave} loading={saving} />
        <View style={{ height: 10 }} />
        <Button
          title="Connect a Coach"
          variant="ghost"
          onPress={() => navigation.navigate('ConnectCoach')}
        />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  tierCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
  },
  tierLabel: { color: theme.colors.textMuted, fontSize: 12 },
  tierValue: { color: theme.colors.primary, fontSize: 20, fontWeight: '800', marginTop: 2 },
  note: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: theme.spacing(2) },
  feesRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderWidth: 1, borderRadius: theme.radius,
    padding: 14, marginBottom: theme.spacing(2),
  },
  feesLabel: { color: theme.colors.textMuted, fontSize: 13 },
  feesValue: { fontSize: 16, fontWeight: '800' },
});
