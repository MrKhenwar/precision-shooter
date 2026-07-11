// Real sign-in form (styled to the reference). Uses AuthContext.signIn which
// hits the Django /auth/login/ endpoint and persists the JWT session.
import React, { useState } from 'react';
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

import { useAuth } from '../../store/AuthContext';
import { theme } from '../../theme';

export default function SignInScreen({ navigation }) {
  const { signIn, notice, clearNotice } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(identifier.trim(), password);
      // On success AuthContext sets `user` and the navigator swaps to the app.
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not sign in. Check your details.');
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
          <Text style={styles.h1}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue</Text>

          {notice ? <Text style={styles.error}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Email or Mobile</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com or 9990001111"
            placeholderTextColor={theme.colors.textFaint}
            autoCapitalize="none"
            value={identifier}
            onChangeText={(t) => { setIdentifier(t); if (notice) clearNotice(); }}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textFaint}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
            <Text style={styles.link}>New here? Create an account</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1.5) },
  content: { padding: theme.spacing(3), paddingTop: theme.spacing(2) },
  h1: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
  sub: { color: theme.colors.textMuted, fontSize: 14, marginTop: 6, marginBottom: theme.spacing(3) },
  label: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 8, marginTop: 14 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radiusSm,
    color: theme.colors.text, fontSize: 16,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius,
    paddingVertical: 16, alignItems: 'center', marginTop: theme.spacing(3),
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: theme.colors.primary, fontWeight: '600', textAlign: 'center', marginTop: 20 },
  error: {
    color: theme.colors.danger, backgroundColor: theme.colors.dangerDim,
    borderRadius: theme.radiusSm, padding: 12, marginBottom: 6, fontSize: 13,
  },
});
