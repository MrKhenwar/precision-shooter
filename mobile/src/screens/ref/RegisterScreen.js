// Real registration (styled to the reference). Persona chips + fields, posts
// to /auth/register/ then routes to OTP verification.
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { register } from '../../api/auth';
import { PERSONAS, theme } from '../../theme';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function Input({ label, error, ...props }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && { borderColor: theme.colors.danger }]}
        placeholderTextColor={theme.colors.textFaint}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const [persona, setPersona] = useState('athlete');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const pwdOk = useMemo(() => PASSWORD_RE.test(password), [password]);

  async function onSubmit() {
    setError(null);
    if (!email && !mobile) return setError('Enter an email or a mobile number.');
    if (!pwdOk) return setError('Password needs 8+ chars with upper, lower, number and special.');
    setLoading(true);
    try {
      const payload = { persona, first_name: firstName, last_name: lastName, password };
      if (email) payload.email = email.trim();
      if (mobile) payload.mobile = mobile.trim();
      const data = await register(payload);
      navigation.navigate('VerifyOtp', {
        identifier: email.trim() || mobile.trim(),
        debugOtp: data.debug_otp,
      });
    } catch (e) {
      const d = e.response?.data;
      setError(
        d?.detail ||
          (d && typeof d === 'object' ? Object.values(d).flat().join(' ') : null) ||
          'Registration failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text style={styles.h1}>Create account</Text>
          <Text style={styles.sub}>Pick your role and register</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={[styles.label, { marginTop: 18 }]}>I am a…</Text>
          <View style={styles.chips}>
            {Object.entries(PERSONAS).map(([key, lbl]) => {
              const active = persona === key;
              return (
                <Pressable key={key} onPress={() => setPersona(key)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{lbl}</Text>
                </Pressable>
              );
            })}
          </View>

          <Input label="First name" value={firstName} onChangeText={setFirstName} />
          <Input label="Last name" value={lastName} onChangeText={setLastName} />
          <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Input label="Mobile" placeholder="9990001111" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} />
          <Input
            label="Password"
            placeholder="8+ chars, mixed case, number, symbol"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={password && !pwdOk ? 'Does not meet the policy yet.' : null}
          />

          <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Registering…' : 'Register'}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1.5) },
  content: { padding: theme.spacing(3), paddingTop: theme.spacing(1), paddingBottom: theme.spacing(6) },
  h1: { color: theme.colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: theme.colors.textMuted, fontSize: 14, marginTop: 6 },
  label: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 8 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radiusSm,
    color: theme.colors.text, fontSize: 16,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  fieldError: { color: theme.colors.danger, fontSize: 12, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  btn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius, paddingVertical: 16, alignItems: 'center', marginTop: theme.spacing(3) },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: theme.colors.primary, fontWeight: '600', textAlign: 'center', marginTop: 18 },
  error: { color: theme.colors.danger, backgroundColor: theme.colors.dangerDim, borderRadius: theme.radiusSm, padding: 12, marginTop: 12, fontSize: 13 },
});
