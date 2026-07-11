import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, Field, Heading, Link } from '../../components/ui';
import { register } from '../../api/auth';
import { PERSONAS, theme } from '../../theme';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

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
    if (!email && !mobile) {
      setError('Enter an email or a mobile number.');
      return;
    }
    if (!pwdOk) {
      setError('Password needs 8+ chars with upper, lower, number and special.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        persona,
        first_name: firstName,
        last_name: lastName,
        password,
      };
      if (email) payload.email = email.trim();
      if (mobile) payload.mobile = mobile.trim();
      const data = await register(payload);
      navigation.navigate('VerifyOtp', {
        identifier: email.trim() || mobile.trim(),
        debugOtp: data.debug_otp, // present only in DEBUG backend
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.spacing(3), paddingVertical: 24 }}
      >
        <Heading sub="Pick your role and register">Create account</Heading>
        {error ? <Banner kind="error">{error}</Banner> : null}

        <Text style={styles.label}>I am a…</Text>
        <View style={styles.personaRow}>
          {Object.entries(PERSONAS).map(([key, label]) => {
            const active = persona === key;
            return (
              <Pressable
                key={key}
                onPress={() => setPersona(key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Field label="First name" value={firstName} onChangeText={setFirstName} />
        <Field label="Last name" value={lastName} onChangeText={setLastName} />
        <Field
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="Mobile"
          placeholder="9990001111"
          keyboardType="phone-pad"
          value={mobile}
          onChangeText={setMobile}
        />
        <Field
          label="Password"
          placeholder="At least 8 chars, mixed case, number, symbol"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={password && !pwdOk ? 'Does not meet the policy yet.' : null}
        />
        <Button title="Register" onPress={onSubmit} loading={loading} />
        <Link onPress={() => navigation.goBack()}>Already have an account? Sign in</Link>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.colors.textMuted, marginBottom: 8, fontSize: 13 },
  personaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing(2) },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: theme.colors.primaryText },
});
