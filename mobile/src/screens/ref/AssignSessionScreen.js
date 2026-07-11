// Coach assigns a training session (date + drills) to an athlete.
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, Field, Header } from '../../components/kit';
import { createSession } from '../../api/training';
import { theme } from '../../theme';

export default function AssignSessionScreen({ navigation, route }) {
  const { athleteId, name } = route.params || {};
  const [title, setTitle] = useState('');
  const [drills, setDrills] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function onSave() {
    setError(null);
    if (!title.trim()) return setError('Give the session a title.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Date must be YYYY-MM-DD.');
    setSaving(true);
    try {
      await createSession({ athlete: athleteId, title: title.trim(), drills, date });
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not assign session.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Assign Training" onLeft={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {name ? <Text style={styles.subject}>For {name}</Text> : null}
          {error ? <Banner kind="error">{error}</Banner> : null}
          <Field label="Session Title" placeholder="e.g. Live Fire - 60 Shots" value={title} onChangeText={setTitle} />
          <Field label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} autoCapitalize="none" />
          <Field label="Drills" placeholder="Holding drills, dry firing, match sim…" value={drills} onChangeText={setDrills} multiline />
          <Button title="Assign Session" icon="add-circle" onPress={onSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  subject: { color: theme.colors.text, fontSize: 15, fontWeight: '600', marginBottom: 14 },
});
