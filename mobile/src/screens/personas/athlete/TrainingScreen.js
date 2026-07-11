import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { completeSession, getMySessions } from '../../../api/training';
import { theme } from '../../../theme';

export default function TrainingScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setSessions(await getMySessions());
    } catch (_) { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function toggle(s) {
    setBusyId(s.id);
    try {
      const updated = await completeSession(s.id, !s.completed);
      setSessions((list) => list.map((x) => (x.id === s.id ? updated : x)));
    } catch (_) { /* ignore */ } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
        {sessions.length === 0 ? (
          <Text style={styles.empty}>No training assigned yet. Your coach will add sessions here.</Text>
        ) : (
          sessions.map((s) => (
            <View key={s.id} style={styles.card}>
              <Pressable
                onPress={() => toggle(s)}
                disabled={busyId === s.id}
                style={[styles.check, s.completed && styles.checkDone]}
              >
                <Text style={styles.checkMark}>{s.completed ? '✓' : ''}</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, s.completed && styles.titleDone]}>{s.title}</Text>
                <Text style={styles.date}>{s.date}</Text>
                {s.drills ? <Text style={styles.drills}>{s.drills}</Text> : null}
              </View>
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
  card: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginBottom: 10 },
  check: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2,
  },
  checkDone: { backgroundColor: theme.colors.primary },
  checkMark: { color: theme.colors.primaryText, fontWeight: '900', fontSize: 16 },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  titleDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  date: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  drills: { color: theme.colors.textMuted, marginTop: 6, fontSize: 13 },
});
