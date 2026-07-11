import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { chooseAI, getSubscription } from '../../../api/billing';
import { Banner, Button } from '../../../components/ui';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { theme } from '../../../theme';

export default function PlanScreen() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setSub(await getSubscription());
    } catch (_) { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function toggleAI(next) {
    setBusy(true);
    try {
      setSub(await chooseAI(next));
    } catch (_) { /* ignore */ } finally {
      setBusy(false);
    }
  }

  if (loading || !sub) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <KeyboardScreen>
      {sub.show_trial_nudge && (
        <Banner kind="info">
          Your free trial ends in {sub.trial_days_left} days — choose a plan to keep training.
        </Banner>
      )}

      <View style={styles.hero}>
        <Text style={styles.planLabel}>{sub.plan_label}</Text>
        <Text style={styles.price}>
          {sub.price === 0 ? 'Free' : `₹${sub.price}`}
          {sub.price !== 0 ? <Text style={styles.per}> / month</Text> : null}
        </Text>
        {sub.in_trial ? (
          <Text style={styles.trial}>{sub.trial_days_left} trial days left · ends {sub.trial_end_date}</Text>
        ) : null}
      </View>

      <Text style={styles.section}>Plans</Text>

      <View style={[styles.plan, sub.plan === 'coached' && styles.planActive]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.planTitle}>Coached</Text>
          <Text style={styles.planDesc}>₹10/month · linked to your coach</Text>
        </View>
        <Text style={[styles.tag, { color: sub.is_coached ? theme.colors.success : theme.colors.textMuted }]}>
          {sub.is_coached ? (sub.plan === 'coached' ? 'Active' : 'Eligible') : 'Link a coach'}
        </Text>
      </View>

      <View style={[styles.plan, sub.plan === 'ai' && styles.planActive]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.planTitle}>AI Coaching</Text>
          <Text style={styles.planDesc}>₹50/month · independent AI-guided training</Text>
        </View>
        <Text style={[styles.tag, { color: sub.ai_opted ? theme.colors.success : theme.colors.textMuted }]}>
          {sub.ai_opted ? 'Opted in' : 'Off'}
        </Text>
      </View>

      <View style={{ marginTop: theme.spacing(2) }}>
        {sub.ai_opted ? (
          <Button title="Turn off AI coaching" variant="ghost" loading={busy} onPress={() => toggleAI(false)} />
        ) : (
          <Button title="Opt into AI Coaching (₹50/mo)" loading={busy} onPress={() => toggleAI(true)} />
        )}
      </View>

      <Text style={styles.note}>
        While your trial is active everything is free. After it ends, you're billed ₹10/month if
        linked to a coach, or ₹50/month with AI coaching.
      </Text>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  hero: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 20,
    alignItems: 'center',
  },
  planLabel: { color: theme.colors.textMuted, fontSize: 13 },
  price: { color: theme.colors.primary, fontSize: 40, fontWeight: '800', marginTop: 4 },
  per: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '600' },
  trial: { color: theme.colors.textMuted, marginTop: 6, fontSize: 13 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: theme.spacing(1) },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    marginBottom: 10,
  },
  planActive: { borderColor: theme.colors.primary },
  planTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  planDesc: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13 },
  tag: { fontWeight: '700', fontSize: 12, marginLeft: 8 },
  note: { color: theme.colors.textMuted, fontSize: 12, marginTop: theme.spacing(2), lineHeight: 18 },
});
