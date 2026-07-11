// Athlete creates a daily diary entry (FR-010).
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, Field, Header } from '../../components/kit';
import { addDiaryEntry } from '../../api/performance';
import { theme } from '../../theme';

function Slider1to10({ label, value, onChange }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.sliderHead}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sliderVal}>{value}/10</Text>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: 10 }).map((_, i) => {
          const n = i + 1;
          const on = n <= value;
          return <Pressable key={n} onPress={() => onChange(n)} style={[styles.dot, on && styles.dotOn]} />;
        })}
      </View>
    </View>
  );
}

export default function DiaryEntryScreen({ navigation }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(4);
  const [rhr, setRhr] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function onSave() {
    setError(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Date must be YYYY-MM-DD.');
    setSaving(true);
    try {
      await addDiaryEntry({
        date,
        sleep_quality: sleep,
        stress_level: stress,
        resting_hr: rhr ? parseInt(rhr, 10) : null,
        notes,
      });
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.detail || (e.response?.data && Object.values(e.response.data).flat().join(' ')) || 'Could not save entry.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="New Diary Entry" onLeft={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error ? <Banner kind="error">{error}</Banner> : null}
          <Field label="Date" value={date} onChangeText={setDate} autoCapitalize="none" />
          <View style={styles.card}>
            <Slider1to10 label="Sleep Quality" value={sleep} onChange={setSleep} />
            <Slider1to10 label="Stress Level" value={stress} onChange={setStress} />
          </View>
          <Field label="Resting Heart Rate (bpm)" keyboardType="number-pad" placeholder="30–120" value={rhr} onChangeText={setRhr} />
          <Field label="Training Notes" placeholder="How did the session feel?" value={notes} onChangeText={setNotes} multiline />
          <Button title="Save Entry" icon="save" onPress={onSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 14 },
  label: { color: theme.colors.textMuted, fontSize: 13 },
  sliderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sliderVal: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 10, borderRadius: 5, backgroundColor: theme.colors.surfaceAlt },
  dotOn: { backgroundColor: theme.colors.primary },
});
