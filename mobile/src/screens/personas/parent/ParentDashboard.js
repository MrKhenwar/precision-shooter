import React, { useCallback, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getMyChildren, requestChildLink } from '../../../api/personas';
import { Banner, Button, Field } from '../../../components/ui';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { useAuth } from '../../../store/AuthContext';
import { PERSONA_BANNER } from '../../../images';
import { theme } from '../../../theme';

export default function ParentDashboard({ navigation }) {
  const { user, signOut } = useAuth();
  const [children, setChildren] = useState([]);
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setChildren(await getMyChildren());
    } catch (_) { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onLink() {
    setError(null);
    setInfo(null);
    if (!mobile.trim()) { setError("Enter your child's registered mobile number."); return; }
    setSending(true);
    try {
      const res = await requestChildLink(mobile.trim());
      setInfo(res.message);
      setMobile('');
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not send request.');
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardScreen contentStyle={{ padding: 0 }} edges={['top']}>
      <ImageBackground source={{ uri: PERSONA_BANNER.parent }} style={styles.banner} imageStyle={{ opacity: 0.55 }}>
        <View style={styles.bannerOverlay}>
          <Text style={styles.brand}>🎯 Precision Shooter</Text>
          <Text style={styles.hello}>{user?.full_name || user?.mobile}</Text>
          <Text style={styles.role}>Parent · ₹20/month</Text>
        </View>
      </ImageBackground>

      <View style={{ padding: theme.spacing(2) }}>
        {error ? <Banner kind="error">{error}</Banner> : null}
        {info ? <Banner kind="success">{info}</Banner> : null}

        <Text style={styles.section}>Link your child</Text>
        <Text style={styles.hint}>Enter your child's registered mobile. They approve the request, then you get read-only access.</Text>
        <Field label="Child's mobile" placeholder="9111100000" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} />
        <Button title="Send Request" onPress={onLink} loading={sending} />

        <Text style={styles.section}>Your children</Text>
        {children.length === 0 ? (
          <Text style={styles.empty}>No linked children yet.</Text>
        ) : (
          children.map((c) => (
            <Pressable key={c.id} style={styles.card} onPress={() => navigation.navigate('ChildDetail', { child: c })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.full_name}</Text>
                <Text style={styles.meta}>
                  {(c.discipline || '—').replace('_', ' ')} · {c.age_category || '—'} · {c.attendance_pct}% attendance
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}

        <View style={{ marginTop: theme.spacing(3) }}>
          <Button title="Sign out" variant="ghost" onPress={signOut} />
        </View>
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  banner: { height: 160, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'flex-end' },
  bannerOverlay: { padding: theme.spacing(2), backgroundColor: 'rgba(11,15,20,0.35)' },
  brand: { color: theme.colors.primary, fontWeight: '800', fontSize: 13, marginBottom: 6 },
  hello: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  role: { color: theme.colors.primary, fontWeight: '600', marginTop: 2 },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(2), marginBottom: 6 },
  hint: { color: theme.colors.textMuted, fontSize: 12, marginBottom: theme.spacing(1) },
  empty: { color: theme.colors.textMuted },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginBottom: 10 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13, textTransform: 'capitalize' },
  chevron: { color: theme.colors.textMuted, fontSize: 26 },
});
