// Athlete profile completion / edit (FR-001 registration field matrix).
// current_tier is coach-controlled and shown read-only.
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, ChipSelect, Field, Header, Loading } from '../../components/kit';
import { TIER, label } from './labels';
import { getMyProfile, updateMyProfile } from '../../api/athlete';
import { theme } from '../../theme';

const GENDER = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }];
const HAND = [{ value: 'RH', label: 'Right Hand' }, { value: 'LH', label: 'Left Hand' }];
const EYE = [{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }, { value: 'cross', label: 'Cross-Dominant' }];
const DISCIPLINE = [{ value: 'air_rifle', label: '10m Air Rifle' }, { value: 'air_pistol', label: '10m Air Pistol' }];
const DIET = [{ value: 'veg', label: 'Veg' }, { value: 'non_veg', label: 'Non-Veg' }, { value: 'vegan', label: 'Vegan' }, { value: 'eggetarian', label: 'Eggetarian' }];

export default function ProfileEditScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [f, setF] = useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    getMyProfile().then((p) => setF({
      shooting_assoc_id: p.shooting_assoc_id || '', dob: p.dob || '', gender: p.gender || '',
      state: p.state || '', dominant_hand: p.dominant_hand || '', dominant_eye: p.dominant_eye || '',
      discipline: p.discipline || '', diet_type: p.diet_type || '', current_tier: p.current_tier,
      age_category: p.age_category, coach_name: p.coach_name,
    })).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  async function onSave() {
    setError(null);
    if (f.dob && !/^\d{4}-\d{2}-\d{2}$/.test(f.dob)) return setError('DOB must be YYYY-MM-DD.');
    setSaving(true);
    try {
      await updateMyProfile({
        shooting_assoc_id: f.shooting_assoc_id, dob: f.dob || null, gender: f.gender,
        state: f.state, dominant_hand: f.dominant_hand, dominant_eye: f.dominant_eye,
        discipline: f.discipline, diet_type: f.diet_type,
      });
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save profile.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Edit Profile" onLeft={() => navigation.goBack()} />
      {loading ? <Loading /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {error ? <Banner kind="error">{error}</Banner> : null}
            <View style={styles.readonly}>
              <Text style={styles.roText}>Current Level: <Text style={styles.roVal}>{label(TIER, f.current_tier)}</Text>  (set by coach)</Text>
              {f.age_category ? <Text style={[styles.roText, { marginTop: 4 }]}>Age Category: <Text style={styles.roVal}>{cap(f.age_category)}</Text>  (auto from DOB)</Text> : null}
            </View>

            <Field label="Shooting Association ID" placeholder="Optional" value={f.shooting_assoc_id} onChangeText={set('shooting_assoc_id')} autoCapitalize="characters" />
            <Field label="Date of Birth (YYYY-MM-DD)" placeholder="2006-03-12" value={f.dob} onChangeText={set('dob')} autoCapitalize="none" />
            <ChipSelect label="Gender" options={GENDER} value={f.gender} onChange={set('gender')} />
            <Field label="State / Club" placeholder="e.g. Maharashtra Shooting Academy" value={f.state} onChangeText={set('state')} />
            <ChipSelect label="Dominant Hand" options={HAND} value={f.dominant_hand} onChange={set('dominant_hand')} />
            <ChipSelect label="Dominant Eye" options={EYE} value={f.dominant_eye} onChange={set('dominant_eye')} />
            <ChipSelect label="Discipline" options={DISCIPLINE} value={f.discipline} onChange={set('discipline')} />
            <ChipSelect label="Diet Type" options={DIET} value={f.diet_type} onChange={set('diet_type')} />
            <Button title="Save Profile" icon="save" onPress={onSave} loading={saving} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  readonly: { backgroundColor: theme.colors.surface, borderRadius: theme.radiusSm, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 16 },
  roText: { color: theme.colors.textMuted, fontSize: 13 },
  roVal: { color: theme.colors.text, fontWeight: '700' },
});
