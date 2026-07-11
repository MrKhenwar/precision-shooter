// Shooting performance — real aggregates from the athlete's shooting records:
// a trend read-out with coaching advice, score-trend line, key totals, and the
// inner-10 distribution. Athletes can log a new session from here.
import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Header, Loading, SegTabs, withAlpha } from '../../components/kit';
import { LineChart, TargetPlot } from '../../components/charts';
import { useFetch } from './useFetch';
import { getMyShootingRecords, getAthleteShootingRecords } from '../../api/performance';
import { theme } from '../../theme';

const RANGES = [
  { value: '7D', days: 7 },
  { value: '30D', days: 30 },
  { value: '90D', days: 90 },
  { value: '6M', days: 182 },
  { value: '1Y', days: 365 },
];

const DIRS = {
  up: { icon: 'trending-up', color: theme.colors.success, word: 'Improving' },
  down: { icon: 'trending-down', color: theme.colors.danger, word: 'Declining' },
  flat: { icon: 'remove', color: theme.colors.warning, word: 'Steady' },
};

export default function PerformanceScreen({ navigation, route }) {
  const athleteId = route?.params?.athleteId;
  const isOwn = !athleteId;
  const [range, setRange] = useState('30D');
  const chartW = Dimensions.get('window').width - theme.spacing(4) - 32;

  const { data, loading } = useFetch(
    { records: athleteId ? () => getAthleteShootingRecords(athleteId) : getMyShootingRecords },
    [athleteId]
  );
  const all = data.records || [];
  const agg = useMemo(() => computeAgg(all, range), [all, range]);
  const dir = DIRS[agg.direction] || DIRS.flat;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Shooting Performance"
        onLeft={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        left={navigation.canGoBack() ? 'back' : null}
        right={isOwn ? 'add-circle' : undefined}
        onRight={isOwn ? () => navigation.navigate('LogRecord') : undefined}
      />
      {loading ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SegTabs items={RANGES} value={range} onChange={setRange} />

          {agg.count === 0 ? (
            <View style={{ marginTop: theme.spacing(3) }}>
              <EmptyState icon="stats-chart-outline" title="No shooting records" sub="Logged sessions in this range will appear here." />
              {isOwn ? (
                <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('LogRecord')}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.emptyBtnText}>Log a session</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <>
              {/* Insights / analytics */}
              <View style={[styles.insight, { borderColor: withAlpha(dir.color, 0.4) }]}>
                <View style={styles.insightHead}>
                  <View style={[styles.dirPill, { backgroundColor: withAlpha(dir.color, 0.16) }]}>
                    <Ionicons name={dir.icon} size={16} color={dir.color} />
                    <Text style={[styles.dirWord, { color: dir.color }]}>{dir.word}</Text>
                  </View>
                  {agg.deltaTxt ? <Text style={[styles.deltaTxt, { color: dir.color }]}>{agg.deltaTxt}</Text> : null}
                </View>
                <Text style={styles.insightSummary}>{agg.summary}</Text>
                {agg.tips.map((t, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Ionicons name="bulb-outline" size={15} color={theme.colors.gold} style={{ marginTop: 1 }} />
                    <Text style={styles.tipText}>{t}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.card, { marginTop: theme.spacing(2) }]}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>Score Trend <Text style={styles.cardTitleMuted}>(Avg / shot)</Text></Text>
                  <Text style={styles.lastVal}>{agg.trend.length ? agg.trend[agg.trend.length - 1].toFixed(1) : '—'}</Text>
                </View>
                <View style={{ marginTop: 12, alignItems: 'center' }}>
                  <LineChart data={agg.trend} width={chartW} height={160} xLabels={agg.xLabels} min={agg.min} max={agg.max} yTicks={agg.yTicks} color={theme.colors.primary} />
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={[styles.statCard, { marginRight: 6 }]}>
                  <Text style={styles.statLabel}>Total Shots</Text>
                  <Text style={styles.statValue}>{agg.totalShots.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.statCard, { marginHorizontal: 3 }]}>
                  <Text style={styles.statLabel}>Avg Score</Text>
                  <Text style={styles.statValue}>{agg.avgScore != null ? agg.avgScore.toFixed(1) : '—'}</Text>
                </View>
                <View style={[styles.statCard, { marginLeft: 6 }]}>
                  <Text style={styles.statLabel}>Inner 10s</Text>
                  <Text style={styles.statValue}>{agg.innerTens}</Text>
                  <Text style={styles.statDelta}>{agg.innerPct}%</Text>
                </View>
              </View>

              <Text style={styles.section}>Shot Distribution</Text>
              <View style={styles.card}>
                <View style={styles.distRow}>
                  <TargetPlot shots={agg.shots} size={150} />
                  <View style={styles.legend}>
                    {agg.distribution.map((d) => (
                      <View key={d.label} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                        <Text style={styles.legendLabel}>{d.label}</Text>
                        <Text style={styles.legendPct}>{d.pct}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function computeAgg(records, range) {
  const days = RANGES.find((r) => r.value === range)?.days || 30;
  const cutoff = Date.now() - days * 86400000;
  const rows = records
    .filter((r) => new Date(r.date).getTime() >= cutoff)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalShots = rows.reduce((t, r) => t + (r.total_shots || 0), 0);
  const innerTens = rows.reduce((t, r) => t + (r.inner_tens || 0), 0);
  const scored = rows.filter((r) => r.total_score != null && r.total_shots);
  // total_score may be stored as a per-shot average (<= 10.9) or a session
  // sum; normalise both to a per-shot average for display.
  const perShot = (r) => (r.total_score <= 10.9 ? r.total_score : r.total_score / r.total_shots);
  const avgScore = scored.length ? scored.reduce((t, r) => t + perShot(r), 0) / scored.length : null;
  const innerPct = totalShots ? Math.round((100 * innerTens) / totalShots) : 0;

  const trend = scored.map((r) => +perShot(r).toFixed(2));
  const vals = trend.length ? trend : [avgScore || 0];
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const min = Math.max(0, Math.floor(minV) - (minV === maxV ? 1 : 0));
  const max = Math.ceil(maxV) + (minV === maxV ? 1 : 0);
  const step = (max - min) / 4;
  const yTicks = [0, 1, 2, 3, 4].map((i) => +(min + step * i).toFixed(1));
  const xLabels = pickLabels(scored.map((r) => shortDate(r.date)), 5);

  // Grouping average (mm) for advice.
  const grouped = rows.filter((r) => r.grouping_mm != null);
  const avgGroup = grouped.length ? grouped.reduce((t, r) => t + Number(r.grouping_mm), 0) / grouped.length : null;

  const { direction, deltaTxt } = trendDirection(trend);
  const { summary, tips } = insights(direction, deltaTxt, { innerPct, avgScore, avgGroup, sessions: rows.length });

  const otherPct = 100 - innerPct;
  const distribution = [
    { label: 'Inner 10s (10.3+)', pct: innerPct, color: theme.colors.success },
    { label: 'Other shots', pct: otherPct, color: theme.colors.orange },
  ];

  // Scatter reflecting the real inner-10 split.
  const shots = [];
  let seed = 7 + records.length;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const N = 44;
  const innerN = Math.round((N * innerPct) / 100);
  for (let i = 0; i < N; i++) {
    const inner = i < innerN;
    const spread = inner ? 0.05 + rnd() * 0.22 : 0.32 + rnd() * 0.5;
    const ang = rnd() * Math.PI * 2;
    shots.push({ x: Math.cos(ang) * spread, y: Math.sin(ang) * spread, color: inner ? theme.colors.success : theme.colors.orange });
  }

  return { count: rows.length, totalShots, innerTens, innerPct, avgScore, avgGroup, trend, xLabels, min, max, yTicks, distribution, shots, direction, deltaTxt, summary, tips };
}

// Compare the average of the most-recent third vs the earliest third.
function trendDirection(series) {
  if (series.length < 3) return { direction: 'flat', deltaTxt: '' };
  const k = Math.max(1, Math.floor(series.length / 3));
  const early = series.slice(0, k);
  const late = series.slice(-k);
  const mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
  const delta = mean(late) - mean(early);
  const deltaTxt = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} / shot`;
  if (delta > 0.08) return { direction: 'up', deltaTxt };
  if (delta < -0.08) return { direction: 'down', deltaTxt };
  return { direction: 'flat', deltaTxt };
}

function insights(direction, deltaTxt, { innerPct, avgScore, avgGroup, sessions }) {
  let summary;
  if (direction === 'up') summary = `Your average is trending up (${deltaTxt}). Keep the current training load and log every session to hold the momentum.`;
  else if (direction === 'down') summary = `Your average has slipped (${deltaTxt}). Reset with shorter, focused sessions and revisit your pre-shot routine.`;
  else summary = 'Your scores are holding steady. Small technical tweaks are what push a plateau upward.';

  const tips = [];
  if (innerPct < 40) tips.push('Inner-10 rate is low — drill trigger control and follow-through to tighten the centre group.');
  if (avgGroup != null && avgGroup > 15) tips.push(`Groups average ${avgGroup.toFixed(1)}mm — work hold stability (core/balance) and natural point of aim.`);
  if (direction === 'down') tips.push('Add dry-firing between live sessions to rebuild consistency without fatigue.');
  if (avgScore != null && avgScore >= 10.2) tips.push('Scores are competition-grade — introduce match-simulation pressure sets.');
  if (sessions < 4) tips.push('Log more sessions — a few more data points sharpens these trends.');
  if (!tips.length) tips.push('Maintain your routine and keep logging — consistency is the biggest score driver.');
  return { summary, tips: tips.slice(0, 3) };
}

function shortDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
function pickLabels(arr, n) {
  if (arr.length <= n) return arr;
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.round((i / (n - 1)) * (arr.length - 1))]);
  return out;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(4) },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  cardTitleMuted: { color: theme.colors.textMuted, fontWeight: '500', fontSize: 13 },
  lastVal: { color: theme.colors.primary, fontSize: 16, fontWeight: '800' },

  insight: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, padding: 16, marginTop: theme.spacing(2) },
  insightHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dirPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  dirWord: { fontSize: 13, fontWeight: '800' },
  deltaTxt: { fontSize: 13, fontWeight: '700' },
  insightSummary: { color: theme.colors.text, fontSize: 14, lineHeight: 21 },
  tipRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'flex-start' },
  tipText: { flex: 1, color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 },

  statRow: { flexDirection: 'row', marginTop: theme.spacing(2) },
  statCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 14 },
  statLabel: { color: theme.colors.textMuted, fontSize: 12 },
  statValue: { color: theme.colors.text, fontSize: 22, fontWeight: '800', marginTop: 8 },
  statDelta: { color: theme.colors.success, fontSize: 12, fontWeight: '700', marginTop: 4 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(2.5), marginBottom: theme.spacing(1.5) },
  distRow: { flexDirection: 'row', alignItems: 'center' },
  legend: { flex: 1, marginLeft: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendLabel: { flex: 1, color: theme.colors.text, fontSize: 13 },
  legendPct: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' },

  emptyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center', marginTop: theme.spacing(2), backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
