// Athlete profile — real profile detail from /athletes/profile/ rendered as a
// labelled info list. Reference screen 10.
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Header, InfoRow, Loading } from '../../components/kit';
import { useAuth } from '../../store/AuthContext';
import { useFetch } from './useFetch';
import { DIET, DISCIPLINE, EYE, GENDER, HAND, TIER, cap, fmtDate, label } from './labels';
import { getMyProfile } from '../../api/athlete';
import { theme } from '../../theme';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  const { data, loading } = useFetch({ profile: getMyProfile });
  const p = data.profile;

  const name = p?.full_name || user?.full_name || 'Athlete';
  const idText = p?.shooting_assoc_id || `ATH${String(p?.id || 0).padStart(5, '0')}`;

  const rows = p
    ? [
        { icon: 'calendar-outline', label: 'Date of Birth', value: fmtDate(p.dob) },
        { icon: 'male-female-outline', label: 'Gender', value: label(GENDER, p.gender) },
        { icon: 'ribbon-outline', label: 'Age Category', value: p.age_category ? cap(p.age_category) : '—' },
        { icon: 'location-outline', label: 'State / Club', value: p.state || p.coach_name || '—' },
        { icon: 'person-outline', label: 'Coach', value: p.coach_name || 'Not linked' },
        { icon: 'radio-button-on-outline', label: 'Discipline', value: label(DISCIPLINE, p.discipline) },
        { icon: 'hand-left-outline', label: 'Hand / Eye', value: `${label(HAND, p.dominant_hand)} / ${label(EYE, p.dominant_eye)}` },
        { icon: 'trophy-outline', label: 'Current Level', value: label(TIER, p.current_tier) },
        { icon: 'nutrition-outline', label: 'Diet Type', value: label(DIET, p.diet_type) },
        { icon: 'call-outline', label: 'Mobile', value: user?.mobile || '—' },
      ]
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Profile (Athlete)" left={null} right="create-outline" onRight={() => navigation.navigate('ProfileEdit')} />
      {loading ? (
        <Loading />
      ) : !p ? (
        <View style={{ padding: theme.spacing(2) }}>
          <EmptyState icon="person-outline" title="Profile unavailable" sub="Sign in as an athlete to view your profile." />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(name)}</Text>
            </View>
            <View style={{ marginLeft: 14 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{name}</Text>
                {user?.is_verified ? <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} style={{ marginLeft: 6 }} /> : null}
              </View>
              <Text style={styles.athleteId}>Athlete ID: {idText}</Text>
            </View>
          </View>

          <View style={styles.card}>
            {rows.map((r, i) => (
              <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} last={i === rows.length - 1} />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function initials(name = '') {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(4) },
  identity: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing(1), marginBottom: theme.spacing(2.5) },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.primary },
  avatarText: { color: theme.colors.primary, fontWeight: '800', fontSize: 22 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  athleteId: { color: theme.colors.textMuted, fontSize: 13, marginTop: 3 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16 },
});
