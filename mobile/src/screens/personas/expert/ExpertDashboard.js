import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getExpertProfile, updateExpertProfile } from '../../../api/personas';
import { Banner, Button, Field } from '../../../components/ui';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { useAuth } from '../../../store/AuthContext';
import { PERSONA_BANNER } from '../../../images';
import { theme } from '../../../theme';

const EXPERT_LABELS = {
  sc_coach: 'S&C Coach', physio: 'Physiotherapist', psychologist: 'Psychologist',
  consultant: 'Consultant Coach', yoga: 'Yoga Expert', dietician: 'Dietician',
};

export default function ExpertDashboard({ navigation }) {
  const { user, signOut } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const p = await getExpertProfile();
      setForm({
        degree: p.degree || '',
        experience_years: String(p.experience_years || ''),
        service_history: p.service_history || '',
        bio: p.bio || '',
      });
    } catch (_) {
      setError('Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      await updateExpertProfile({
        ...form,
        experience_years: parseInt(form.experience_years, 10) || 0,
      });
      setSaved(true);
    } catch (e) {
      setError(e.response?.data?.detail || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <KeyboardScreen contentStyle={{ padding: 0 }} edges={['top']}>
      <ImageBackground source={{ uri: PERSONA_BANNER.expert }} style={styles.banner} imageStyle={{ opacity: 0.55 }}>
        <View style={styles.bannerOverlay}>
          <Text style={styles.brand}>🎯 Precision Shooter</Text>
          <Text style={styles.hello}>{user?.full_name || user?.mobile}</Text>
          <Text style={styles.role}>{EXPERT_LABELS[user?.expert_type] || 'External Expert'}</Text>
        </View>
      </ImageBackground>

      <View style={{ padding: theme.spacing(2) }}>
        {error ? <Banner kind="error">{error}</Banner> : null}
        {saved ? <Banner kind="success">Profile saved.</Banner> : null}

        <Text style={styles.section}>Your professional profile</Text>
        <Text style={styles.hint}>Visible to coaches & athletes in the expert directory.</Text>
        <Field label="Degree / Qualification" value={form.degree} onChangeText={set('degree')} />
        <Field label="Years of experience" keyboardType="number-pad" value={form.experience_years} onChangeText={set('experience_years')} />
        <Field label="Service history" value={form.service_history} onChangeText={set('service_history')} multiline />
        <Field label="Bio" value={form.bio} onChangeText={set('bio')} multiline />
        <Button title="Save Profile" onPress={onSave} loading={saving} />

        <View style={{ height: 10 }} />
        <Button title="View Expert Directory" variant="ghost" onPress={() => navigation.navigate('Directory')} />

        <View style={{ marginTop: theme.spacing(2) }}>
          <Button title="Sign out" variant="ghost" onPress={signOut} />
        </View>
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  banner: { height: 160, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'flex-end' },
  bannerOverlay: { padding: theme.spacing(2), backgroundColor: 'rgba(11,15,20,0.35)' },
  brand: { color: theme.colors.primary, fontWeight: '800', fontSize: 13, marginBottom: 6 },
  hello: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  role: { color: theme.colors.primary, fontWeight: '600', marginTop: 2 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  hint: { color: theme.colors.textMuted, fontSize: 12, marginBottom: theme.spacing(1) },
});
