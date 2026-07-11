// Persona picker — Athlete / Coach / Parent / External Expert cards, each a
// coloured rounded icon tile with title + subtitle and a chevron. Reference 2.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconTile } from '../../components/kit';
import { theme } from '../../theme';

const PERSONAS = [
  { key: 'athlete', title: 'Athlete', sub: 'Track my training & improve', icon: 'walk', color: theme.colors.primary },
  { key: 'coach', title: 'Coach', sub: 'Manage athletes & training', icon: 'people', color: theme.colors.success },
  { key: 'parent', title: 'Parent', sub: "Track my child's progress", icon: 'person', color: theme.colors.pink },
  { key: 'expert', title: 'External Expert', sub: 'Consult & support athletes', icon: 'globe', color: theme.colors.purple },
];

export default function PersonaScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.h1}>Select Persona</Text>
        <Text style={styles.sub}>Choose how you want to continue</Text>

        <View style={{ marginTop: theme.spacing(3), gap: 14 }}>
          {PERSONAS.map((p) => (
            <Pressable
              key={p.key}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
              onPress={() => navigation.navigate('Main')}
            >
              <IconTile icon={p.icon} color={p.color} size={48} iconSize={24} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.title}>{p.title}</Text>
                <Text style={styles.cardSub}>{p.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textFaint} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>You can change this later in settings</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1, padding: theme.spacing(3) },
  h1: { color: theme.colors.text, fontSize: 26, fontWeight: '800', marginTop: theme.spacing(2) },
  sub: { color: theme.colors.textMuted, fontSize: 14, marginTop: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  cardSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 3 },
  footer: { color: theme.colors.textFaint, textAlign: 'center', fontSize: 13, marginTop: theme.spacing(4) },
});
