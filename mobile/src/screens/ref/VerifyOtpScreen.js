// Real OTP verification (styled). Verifies against /auth/verify-otp/ then
// returns to the sign-in screen.
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resendOtp, verifyOtp } from '../../api/auth';
import { theme } from '../../theme';

export default function VerifyOtpScreen({ route, navigation }) {
  const { identifier, debugOtp } = route.params || {};
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(debugOtp ? `Dev OTP: ${debugOtp}` : null);
  const [loading, setLoading] = useState(false);

  async function onVerify() {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(identifier, code.trim());
      navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    } catch (e) {
      setError(e.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError(null);
    try {
      const data = await resendOtp(identifier);
      setInfo(data.debug_otp ? `New dev OTP: ${data.debug_otp}` : 'A new OTP has been sent.');
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not resend OTP.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={styles.h1}>Verify your account</Text>
        <Text style={styles.sub}>Enter the 6-digit code sent to {identifier}</Text>

        {info ? <Text style={styles.info}>{info}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="123456"
          placeholderTextColor={theme.colors.textFaint}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />
        <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} onPress={onVerify} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Verifying…' : 'Verify'}</Text>
        </Pressable>
        <Pressable onPress={onResend} hitSlop={8}>
          <Text style={styles.link}>Didn't get it? Resend OTP</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1.5) },
  content: { padding: theme.spacing(3), paddingTop: theme.spacing(2) },
  h1: { color: theme.colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: theme.colors.textMuted, fontSize: 14, marginTop: 6, marginBottom: theme.spacing(2) },
  label: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 8, marginTop: 14 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radiusSm,
    color: theme.colors.text, fontSize: 20, letterSpacing: 6,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  btn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius, paddingVertical: 16, alignItems: 'center', marginTop: theme.spacing(3) },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: theme.colors.primary, fontWeight: '600', textAlign: 'center', marginTop: 18 },
  info: { color: theme.colors.primary, backgroundColor: theme.colors.primaryDim, borderRadius: theme.radiusSm, padding: 12, marginTop: 12, fontSize: 13 },
  error: { color: theme.colors.danger, backgroundColor: theme.colors.dangerDim, borderRadius: theme.radiusSm, padding: 12, marginTop: 12, fontSize: 13 },
});
