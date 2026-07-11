// "More" tab — profile summary, role-aware quick links and sign out.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconTile } from '../../components/kit';
import { useAuth } from '../../store/AuthContext';
import { PERSONAS } from '../../theme';
import { theme } from '../../theme';

const ATHLETE_LINKS = [
  { label: 'Daily Diary', sub: 'Sleep, stress & wellness log', icon: 'book', color: theme.colors.purple, to: 'Diary' },
  { label: 'My Profile', sub: 'Personal & discipline details', icon: 'person', color: theme.colors.primary, to: 'Profile' },
  { label: 'Shooting Performance', sub: 'Scores, trends & distribution', icon: 'stats-chart', color: theme.colors.orange, to: 'Performance' },
];

const COACH_LINKS = [
  { label: 'Batches', sub: 'Manage training batches', icon: 'grid', color: theme.colors.success, to: 'Batches' },
  { label: 'Attendance', sub: 'Daily attendance & summary', icon: 'checkmark-done', color: theme.colors.primary, to: 'Attendance' },
];

export default function MoreScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const isCoach = user?.persona === 'coach';
  const links = isCoach ? COACH_LINKS : ATHLETE_LINKS;
  const name = user?.full_name || user?.first_name || 'User';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{PERSONAS[user?.persona] || 'User'}</Text>
          </View>
        </View>

        {links.map((l) => (
          <Pressable key={l.label} style={styles.card} onPress={() => navigation.navigate(l.to)}>
            <IconTile icon={l.icon} color={l.color} size={46} iconSize={22} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.linkName}>{l.label}</Text>
              <Text style={styles.linkSub}>{l.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textFaint} />
          </Pressable>
        ))}

        <Pressable style={styles.signOut} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function initials(name = '') {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1.5) },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  content: { paddingHorizontal: theme.spacing(2), paddingTop: theme.spacing(1), paddingBottom: theme.spacing(4) },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.colors.primary, fontWeight: '800', fontSize: 18 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  role: { color: theme.colors.primary, fontSize: 13, marginTop: 3, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 },
  linkName: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  linkSub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.dangerDim, borderRadius: theme.radius, borderWidth: 1, borderColor: withDanger(), paddingVertical: 15, marginTop: theme.spacing(2) },
  signOutText: { color: theme.colors.danger, fontSize: 15, fontWeight: '700' },
});

function withDanger() {
  return 'rgba(240,85,75,0.4)';
}
