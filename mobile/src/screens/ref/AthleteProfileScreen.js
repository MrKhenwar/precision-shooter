// Athlete profile — identity + working tabs (Overview / Performance / Records /
// Plan / More). Coach view (route athleteId) or athlete self view. Reference 4.
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, ChipSelect, EmptyState, Header, InfoRow, Loading } from '../../components/kit';
import { MenuSheet } from '../../components/MenuSheet';
import { Ring } from '../../components/charts';
import { useAuth } from '../../store/AuthContext';
import { useFetch } from './useFetch';
import { DIET, DISCIPLINE, EYE, GENDER, HAND, TIER, cap, fmtDate, fmtDay, label } from './labels';
import { getMyProfile } from '../../api/athlete';
import { setAthleteTier } from '../../api/coach';
import { getMyEvaluations, getAthleteEvaluations, getMyShootingRecords, getAthleteShootingRecords } from '../../api/performance';
import { getMySessions, getSessions } from '../../api/training';
import { theme } from '../../theme';

const TABS = ['Overview', 'Performance', 'Records', 'Plan', 'More'];
const TIER_OPTIONS = Object.entries(TIER).map(([value, label]) => ({ value, label }));

export default function AthleteProfileScreen({ navigation, route }) {
  const { user, signOut } = useAuth();
  const athleteId = route?.params?.athleteId;
  const isCoachView = !!athleteId;
  const [tab, setTab] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [tierOpen, setTierOpen] = useState(false);
  const [tierOverride, setTierOverride] = useState(null);
  const [pendingTier, setPendingTier] = useState(null);
  const [savingTier, setSavingTier] = useState(false);

  const { data, loading } = useFetch(
    isCoachView
      ? {
          evals: () => getAthleteEvaluations(athleteId),
          sessions: () => getSessions(athleteId),
          records: () => getAthleteShootingRecords(athleteId),
        }
      : {
          profile: getMyProfile,
          evals: getMyEvaluations,
          sessions: getMySessions,
          records: getMyShootingRecords,
        },
    [athleteId]
  );

  const profile = data.profile;
  const name = route?.params?.name || profile?.full_name || user?.full_name || 'Athlete';
  const discipline = route?.params?.discipline || profile?.discipline;
  const tier = tierOverride || route?.params?.tier || profile?.current_tier;

  async function saveTier() {
    if (!pendingTier) return;
    setSavingTier(true);
    try {
      await setAthleteTier(athleteId, pendingTier);
      setTierOverride(pendingTier);
      setTierOpen(false);
    } catch {} finally { setSavingTier(false); }
  }
  const idText = profile?.shooting_assoc_id || (athleteId ? `ATH${String(athleteId).padStart(5, '0')}` : '—');

  const evals = data.evals || [];
  const records = data.records || [];
  const sessions = data.sessions || [];
  const latest = evals[0];

  const metaLine = [label(DISCIPLINE, discipline), label(HAND, profile?.dominant_hand), profile?.dominant_eye ? `${label(EYE, profile?.dominant_eye)} Eye` : null]
    .filter((x) => x && x !== '—')
    .join('  ·  ');

  const menuItems = [
    { icon: 'person', label: 'My Profile', color: theme.colors.primary, onPress: () => navigation.navigate('Profile') },
    { icon: 'create', label: 'Edit Profile', color: theme.colors.cyan, onPress: () => navigation.navigate('ProfileEdit') },
    { icon: 'stats-chart', label: 'Performance', color: theme.colors.orange, onPress: () => navigation.navigate('Performance') },
    { icon: 'document-text', label: 'Log Shooting Record', color: theme.colors.cyan, onPress: () => navigation.navigate('LogRecord') },
    { icon: 'clipboard', label: 'My Evaluations', color: theme.colors.success, onPress: () => navigation.navigate('Evaluations') },
    { icon: 'book', label: 'Daily Diary', color: theme.colors.purple, onPress: () => navigation.navigate('Diary') },
    { icon: 'link', label: 'Connect a Coach', color: theme.colors.primary, onPress: () => navigation.navigate('ConnectCoach') },
    { icon: 'card', label: 'My Fees', color: theme.colors.gold, onPress: () => navigation.navigate('MyFees') },
    { icon: 'people', label: 'Parent Access', color: theme.colors.pink, onPress: () => navigation.navigate('ParentAccess') },
    { icon: 'log-out-outline', label: 'Sign Out', color: theme.colors.danger, danger: true, onPress: signOut },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isCoachView ? (
        <MenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Precision Shooter" subtitle={name} items={menuItems} />
      ) : null}
      <Header
        title="Athlete Profile"
        left={isCoachView ? 'back' : 'menu'}
        onLeft={() => (isCoachView ? navigation.goBack() : setMenuOpen(true))}
        right="create-outline"
        onRight={() => (isCoachView ? (setPendingTier(tier), setTierOpen(true)) : navigation.navigate('ProfileEdit'))}
      />

      {/* Coach: set performance tier (FR-004) */}
      <Modal visible={tierOpen} transparent animationType="slide" onRequestClose={() => setTierOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => !savingTier && setTierOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Set Performance Level</Text>
          <Text style={styles.sheetSub}>{name}</Text>
          <View style={{ marginTop: 16 }}>
            <ChipSelect options={TIER_OPTIONS} value={pendingTier} onChange={setPendingTier} />
          </View>
          <Button title="Save Level" icon="save" loading={savingTier} onPress={saveTier} style={{ marginTop: 8 }} />
          <Button title="Cancel" variant="ghost" disabled={savingTier} onPress={() => setTierOpen(false)} style={{ marginTop: 10 }} />
        </View>
      </Modal>
      {loading ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Identity */}
          <View style={styles.identity}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(name)}</Text></View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{name}</Text>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} style={{ marginLeft: 6 }} />
              </View>
              <Text style={styles.athleteId}>Athlete ID: {idText}</Text>
              <View style={{ marginTop: 8 }}><Badge label={label(TIER, tier)} color={theme.colors.gold} /></View>
              {metaLine ? <Text style={styles.meta}>{metaLine}</Text> : null}
            </View>
          </View>

          {/* Coach actions */}
          {isCoachView && (
            <View style={styles.actionRow}>
              <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('EvaluationForm', { athleteId, name })}>
                <Ionicons name="clipboard" size={18} color={theme.colors.primary} />
                <Text style={styles.actionText}>Evaluate</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('AssignSession', { athleteId, name })}>
                <Ionicons name="add-circle" size={18} color={theme.colors.success} />
                <Text style={styles.actionText}>Assign</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('Evaluations', { athleteId, name })}>
                <Ionicons name="analytics" size={18} color={theme.colors.orange} />
                <Text style={styles.actionText}>History</Text>
              </Pressable>
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const active = t === tab;
              return (
                <Pressable key={t} onPress={() => setTab(t)} style={styles.tab}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t}</Text>
                  {active ? <View style={styles.tabUnderline} /> : null}
                </Pressable>
              );
            })}
          </View>

          {tab === 'Overview' && <OverviewTab navigation={navigation} latest={latest} sessions={sessions} athleteId={athleteId} name={name} />}
          {tab === 'Performance' && <PerformanceTab navigation={navigation} records={records} athleteId={athleteId} name={name} />}
          {tab === 'Records' && <RecordsTab records={records} />}
          {tab === 'Plan' && <PlanTab sessions={sessions} />}
          {tab === 'More' && <MoreTab profile={profile} user={user} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function OverviewTab({ navigation, latest, sessions, athleteId, name }) {
  const rings = latest
    ? [
        { value: latest.shooting_score * 10, color: theme.colors.success, label: 'Technical' },
        { value: latest.sc_score * 10, color: theme.colors.primary, label: 'S & C' },
        { value: latest.overall_score * 10, color: theme.colors.orange, label: 'Overall' },
      ]
    : [];
  const planDate = sessions[0]?.date;
  const plan = sessions.filter((s) => s.date === planDate);
  const done = plan.filter((s) => s.completed).length;
  return (
    <>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <Pressable onPress={() => navigation.navigate('Performance', athleteId ? { athleteId, name } : undefined)} hitSlop={8}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        {rings.length ? (
          <View style={styles.ringRow}>{rings.map((r, i) => <Ring key={i} value={r.value} color={r.color} size={80} label={r.label} />)}</View>
        ) : (
          <EmptyState icon="analytics-outline" title="No evaluations yet" sub="Coach evaluations will show here." />
        )}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Today's Plan</Text>
        {plan.length ? <Text style={styles.completed}>{done} / {plan.length} Completed</Text> : null}
      </View>
      <View style={[styles.card, plan.length && { paddingVertical: 4 }]}>
        {plan.length ? plan.map((s, i) => (
          <View key={s.id} style={[styles.planRow, i !== plan.length - 1 && styles.rowBorder]}>
            <Ionicons name={s.completed ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={s.completed ? theme.colors.success : theme.colors.textFaint} />
            <Text style={[styles.planLabel, !s.completed && { color: theme.colors.textMuted }]}>{s.title}</Text>
            <Text style={styles.planMeta}>{s.completed ? 'Done' : 'Pending'}</Text>
          </View>
        )) : <EmptyState icon="clipboard-outline" title="No sessions planned" sub="Assigned training will appear here." />}
      </View>
    </>
  );
}

function perShot(r) { return r.total_score == null ? null : r.total_score <= 10.9 ? r.total_score : r.total_score / r.total_shots; }

function PerformanceTab({ navigation, records, athleteId, name }) {
  if (!records.length) return <View style={styles.card}><EmptyState icon="stats-chart-outline" title="No shooting records" sub="Logged sessions appear here." /></View>;
  const totalShots = records.reduce((t, r) => t + (r.total_shots || 0), 0);
  const innerTens = records.reduce((t, r) => t + (r.inner_tens || 0), 0);
  const scored = records.filter((r) => perShot(r) != null);
  const avg = scored.length ? scored.reduce((t, r) => t + perShot(r), 0) / scored.length : null;
  const innerPct = totalShots ? Math.round((100 * innerTens) / totalShots) : 0;
  return (
    <>
      <View style={styles.statRow}>
        <View style={[styles.miniCard, { marginRight: 6 }]}><Text style={styles.miniLabel}>Total Shots</Text><Text style={styles.miniValue}>{totalShots.toLocaleString('en-IN')}</Text></View>
        <View style={[styles.miniCard, { marginHorizontal: 3 }]}><Text style={styles.miniLabel}>Avg Score</Text><Text style={styles.miniValue}>{avg != null ? avg.toFixed(1) : '—'}</Text></View>
        <View style={[styles.miniCard, { marginLeft: 6 }]}><Text style={styles.miniLabel}>Inner 10s</Text><Text style={styles.miniValue}>{innerTens}</Text><Text style={styles.miniDelta}>{innerPct}%</Text></View>
      </View>
      <Pressable style={styles.fullBtn} onPress={() => navigation.navigate('Performance', athleteId ? { athleteId, name } : undefined)}>
        <Ionicons name="analytics" size={18} color="#fff" />
        <Text style={styles.fullBtnText}>View Full Analysis</Text>
      </Pressable>
    </>
  );
}

function RecordsTab({ records }) {
  if (!records.length) return <View style={styles.card}><EmptyState icon="document-text-outline" title="No records" sub="Shooting logs appear here." /></View>;
  return (
    <View style={{ marginTop: theme.spacing(1) }}>
      {records.map((r) => (
        <View key={r.id} style={styles.recordRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.recordDate}>{fmtDay(r.date)}</Text>
            <Text style={styles.recordSub}>{r.total_shots} shots · {r.inner_ten_pct}% inner 10s{r.grouping_mm ? ` · ${r.grouping_mm}mm` : ''}</Text>
          </View>
          <Text style={styles.recordScore}>{perShot(r) != null ? perShot(r).toFixed(1) : '—'}</Text>
        </View>
      ))}
    </View>
  );
}

function PlanTab({ sessions }) {
  if (!sessions.length) return <View style={styles.card}><EmptyState icon="clipboard-outline" title="No sessions" sub="Assigned training appears here." /></View>;
  return (
    <View style={{ marginTop: theme.spacing(1) }}>
      {sessions.map((s) => (
        <View key={s.id} style={styles.recordRow}>
          <Ionicons name={s.completed ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={s.completed ? theme.colors.success : theme.colors.textFaint} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.recordDate}>{s.title}</Text>
            <Text style={styles.recordSub}>{fmtDay(s.date)}{s.drills ? ` · ${s.drills}` : ''}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function MoreTab({ profile, user }) {
  const rows = [
    { icon: 'calendar-outline', label: 'Date of Birth', value: fmtDate(profile?.dob) },
    { icon: 'male-female-outline', label: 'Gender', value: label(GENDER, profile?.gender) },
    { icon: 'ribbon-outline', label: 'Age Category', value: profile?.age_category ? cap(profile.age_category) : '—' },
    { icon: 'person-outline', label: 'Coach', value: profile?.coach_name || 'Not linked' },
    { icon: 'nutrition-outline', label: 'Diet Type', value: label(DIET, profile?.diet_type) },
    { icon: 'call-outline', label: 'Mobile', value: user?.mobile || '—' },
  ];
  return (
    <View style={[styles.card, { marginTop: theme.spacing(1.5), paddingHorizontal: 16 }]}>
      {rows.map((r, i) => <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} last={i === rows.length - 1} />)}
    </View>
  );
}

function initials(name = '') { return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(); }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(4) },
  identity: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing(1) },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.primary },
  avatarText: { color: theme.colors.primary, fontWeight: '800', fontSize: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  athleteId: { color: theme.colors.textMuted, fontSize: 13, marginTop: 3 },
  meta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: theme.spacing(2) },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radiusSm, paddingVertical: 12 },
  actionText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },

  tabs: { flexDirection: 'row', marginTop: theme.spacing(2.5), borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { marginRight: 20, paddingBottom: 10 },
  tabText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: theme.colors.primary },
  tabUnderline: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, borderRadius: 2, backgroundColor: theme.colors.primary },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing(2.5), marginBottom: theme.spacing(1.5) },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  seeAll: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  completed: { color: theme.colors.textMuted, fontSize: 13 },

  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginTop: theme.spacing(1.5) },
  ringRow: { flexDirection: 'row', justifyContent: 'space-around' },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderSoft },
  planLabel: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '500', marginLeft: 12 },
  planMeta: { color: theme.colors.textMuted, fontSize: 13 },

  statRow: { flexDirection: 'row', marginTop: theme.spacing(2) },
  miniCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 14 },
  miniLabel: { color: theme.colors.textMuted, fontSize: 12 },
  miniValue: { color: theme.colors.text, fontSize: 20, fontWeight: '800', marginTop: 8 },
  miniDelta: { color: theme.colors.success, fontSize: 12, fontWeight: '700', marginTop: 4 },
  fullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary, borderRadius: theme.radius, paddingVertical: 15, marginTop: theme.spacing(2) },
  fullBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  recordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 10 },
  recordDate: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  recordSub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
  recordScore: { color: theme.colors.primary, fontSize: 18, fontWeight: '800' },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: theme.spacing(3), paddingBottom: theme.spacing(5), borderWidth: 1, borderColor: theme.colors.border },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: theme.colors.border, marginBottom: 16 },
  sheetTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  sheetSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 3 },
});
