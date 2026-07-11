// Daily diary — wellness insights (sleep / stress / resting-HR trends with
// advice) plus a date-stepped detail view of each logged entry.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Header, Loading, withAlpha } from '../../components/kit';
import { useAuth } from '../../store/AuthContext';
import { useFetch } from './useFetch';
import { fmtDay, sleepLabel, stressLabel } from './labels';
import { getMyDiary, getAthleteDiary } from '../../api/performance';
import { theme } from '../../theme';

const C = { success: theme.colors.success, warning: theme.colors.warning, danger: theme.colors.danger };

function MetricCard({ label, value, valueColor, note, noteColor, icon, iconColor }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, valueColor && { color: valueColor }]}>{value}</Text>
        {note ? <Text style={[styles.note, { color: noteColor || theme.colors.success }]}>{note}</Text> : null}
      </View>
      <View style={[styles.iconBadge, { backgroundColor: withAlpha(iconColor, 0.18) }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
    </View>
  );
}

// Compact trend row for the insights card.
function TrendRow({ icon, iconColor, label, avg, unit, dir }) {
  return (
    <View style={styles.trendRow}>
      <View style={[styles.trendIcon, { backgroundColor: withAlpha(iconColor, 0.18) }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.trendLabel}>{label}</Text>
      <Text style={styles.trendAvg}>{avg}<Text style={styles.trendUnit}>{unit}</Text></Text>
      <View style={[styles.trendPill, { backgroundColor: withAlpha(dir.color, 0.16) }]}>
        <Ionicons name={dir.icon} size={13} color={dir.color} />
        <Text style={[styles.trendPillTxt, { color: dir.color }]}>{dir.word}</Text>
      </View>
    </View>
  );
}

export default function DiaryScreen({ navigation, route }) {
  const { user } = useAuth();
  const athleteId = route?.params?.athleteId;
  const isCoach = user?.persona === 'coach' && athleteId;
  const { data, loading } = useFetch(
    { entries: isCoach ? () => getAthleteDiary(athleteId) : getMyDiary },
    [athleteId]
  );
  const entries = data.entries || [];
  const [idx, setIdx] = useState(0);
  const entry = entries[idx];
  const insight = useMemo(() => computeInsights(entries), [entries]);

  const sleep = entry ? sleepLabel(entry.sleep_quality) : null;
  const stress = entry ? stressLabel(entry.stress_level) : null;
  const canBack = navigation.canGoBack();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Daily Diary"
        left={canBack ? 'back' : null}
        onLeft={canBack ? () => navigation.goBack() : undefined}
        right={isCoach ? undefined : 'add-circle'}
        onRight={isCoach ? undefined : () => navigation.navigate('DiaryEntry')}
      />
      {loading ? (
        <Loading />
      ) : !entry ? (
        <View style={{ padding: theme.spacing(2) }}>
          <EmptyState icon="book-outline" title="No diary entries" sub="Logged wellness entries appear here." />
          {!isCoach ? (
            <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('DiaryEntry')}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Add today's entry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Wellness insights across logged entries */}
          {insight ? (
            <View style={styles.insight}>
              <Text style={styles.insightTitle}>Wellness Trends <Text style={styles.insightSub}>· last {insight.n} entries</Text></Text>
              <TrendRow icon="moon" iconColor={theme.colors.purple} label="Sleep" avg={insight.sleep.avg} unit="/10" dir={insight.sleep.dir} />
              <TrendRow icon="pulse" iconColor={theme.colors.warning} label="Stress" avg={insight.stress.avg} unit="/10" dir={insight.stress.dir} />
              <TrendRow icon="heart" iconColor={theme.colors.danger} label="Resting HR" avg={insight.rhr.avg} unit=" bpm" dir={insight.rhr.dir} />
              <View style={styles.adviceRow}>
                <Ionicons name="bulb-outline" size={15} color={theme.colors.gold} style={{ marginTop: 1 }} />
                <Text style={styles.adviceText}>{insight.advice}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.dateRow}>
            <Pressable onPress={() => setIdx((i) => Math.min(entries.length - 1, i + 1))} hitSlop={10} disabled={idx >= entries.length - 1}>
              <Ionicons name="chevron-back" size={20} color={idx >= entries.length - 1 ? theme.colors.textFaint : theme.colors.text} />
            </Pressable>
            <Text style={styles.dateText}>{fmtDay(entry.date)}</Text>
            <Pressable onPress={() => setIdx((i) => Math.max(0, i - 1))} hitSlop={10} disabled={idx <= 0}>
              <Ionicons name="chevron-forward" size={20} color={idx <= 0 ? theme.colors.textFaint : theme.colors.text} />
            </Pressable>
          </View>

          <MetricCard
            label="Sleep Quality"
            value={`${entry.sleep_quality}/10`}
            note={`✓ ${sleep.note}`}
            noteColor={C[sleep.color]}
            icon="moon"
            iconColor={theme.colors.purple}
          />
          <MetricCard
            label="Stress Level"
            value={`${stress.text} · ${entry.stress_level}/10`}
            valueColor={C[stress.color]}
            icon="pulse"
            iconColor={C[stress.color]}
          />
          <MetricCard
            label="Resting Heart Rate"
            value={entry.resting_hr ? `${entry.resting_hr} bpm` : '—'}
            icon="heart"
            iconColor={theme.colors.danger}
          />

          {entry.notes !== null ? (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Notes</Text>
                <Text style={styles.notesText}>{entry.notes || 'No notes for this day.'}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const DIR_UP = { icon: 'trending-up', color: theme.colors.success, word: 'Better' };
const DIR_DOWN = { icon: 'trending-down', color: theme.colors.danger, word: 'Worse' };
const DIR_FLAT = { icon: 'remove', color: theme.colors.textMuted, word: 'Steady' };

// entries arrive newest-first. Compare the recent half vs the older half.
// `goodUp` = higher is better (sleep); otherwise lower is better (stress, rhr).
function metricTrend(values, goodUp) {
  const nums = values.filter((v) => v != null && !isNaN(v));
  if (!nums.length) return { avg: '—', dir: DIR_FLAT };
  const avg = nums.reduce((t, v) => t + v, 0) / nums.length;
  if (nums.length < 3) return { avg: round(avg), dir: DIR_FLAT };
  const k = Math.max(1, Math.floor(nums.length / 2));
  const recent = nums.slice(0, k);
  const older = nums.slice(-k);
  const mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
  const delta = mean(recent) - mean(older); // positive = recent higher
  const eps = goodUp ? 0.4 : (goodUp === false && k >= 1 ? 1.2 : 0.4);
  let dir = DIR_FLAT;
  if (delta > eps) dir = goodUp ? DIR_UP : DIR_DOWN;
  else if (delta < -eps) dir = goodUp ? DIR_DOWN : DIR_UP;
  return { avg: round(avg), dir };
}
const round = (v) => (Math.round(v * 10) / 10).toString();

function computeInsights(entries) {
  if (!entries.length) return null;
  const recent = entries.slice(0, 14);
  const sleep = metricTrend(recent.map((e) => e.sleep_quality), true);
  const stress = metricTrend(recent.map((e) => e.stress_level), false);
  const rhr = metricTrend(recent.map((e) => e.resting_hr), false);

  let advice;
  const avgSleep = parseFloat(sleep.avg) || 0;
  const avgStress = parseFloat(stress.avg) || 0;
  if (avgSleep < 6) advice = 'Sleep is running low — aim for 7–8h; under-recovery blunts hold stability and focus.';
  else if (avgStress > 6) advice = 'Stress is elevated — add breathing/visualisation before sessions and protect a rest day.';
  else if (sleep.dir === DIR_DOWN || stress.dir === DIR_DOWN || rhr.dir === DIR_DOWN) advice = 'Recovery is trending the wrong way — ease training load and prioritise sleep this week.';
  else advice = 'Recovery markers look healthy — good base to push training intensity.';
  return { n: recent.length, sleep, stress, rhr, advice };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(4), paddingTop: theme.spacing(1) },

  insight: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: theme.spacing(1) },
  insightTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800', marginBottom: 12 },
  insightSub: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  trendIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  trendLabel: { flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  trendAvg: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginRight: 10 },
  trendUnit: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, minWidth: 74, justifyContent: 'center' },
  trendPillTxt: { fontSize: 12, fontWeight: '800' },
  adviceRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.borderSoft },
  adviceText: { flex: 1, color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 },

  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginVertical: theme.spacing(2) },
  dateText: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 18, marginBottom: 14 },
  label: { color: theme.colors.textMuted, fontSize: 13 },
  value: { color: theme.colors.text, fontSize: 22, fontWeight: '800', marginTop: 8 },
  note: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  iconBadge: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notesText: { color: theme.colors.text, fontSize: 14, lineHeight: 21, marginTop: 8 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center', marginTop: theme.spacing(2), backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
