import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSession } from '../../../api/training';
import { Banner, Button, Field } from '../../../components/ui';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { theme } from '../../../theme';

export default function AssignSessionScreen({ route, navigation }) {
  const { athlete } = route.params;
  const [title, setTitle] = useState('');
  const [drills, setDrills] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function onSave() {
    setError(null);
    if (!title.trim()) { setError('Session title is required.'); return; }
    setSaving(true);
    try {
      await createSession({ athlete: athlete.id, title: title.trim(), drills, date });
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not assign session.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardScreen>
        <Text style={styles.name}>Assign to {athlete.full_name || `Athlete #${athlete.id}`}</Text>
        {error ? <Banner kind="error">{error}</Banner> : null}
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Field label="Session title" placeholder="Holding drills" value={title} onChangeText={setTitle} />
        <Field
          label="Drills"
          placeholder="3x10min holds, 20 dry-fire, 40 match shots"
          value={drills}
          onChangeText={setDrills}
          multiline
        />
        <Button title="Assign Session" onPress={onSave} loading={saving} />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  name: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: theme.spacing(2) },
});
