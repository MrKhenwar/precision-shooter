import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Banner, Button, Field, Link } from '../../components/ui';
import { useAuth } from '../../store/AuthContext';
import { IMAGES } from '../../images';
import { theme } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { signIn, notice, clearNotice } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const data = await signIn(identifier.trim(), password);
      if (data.previous_device_signed_out) {
        setInfo('Note: you were signed out on your previous device.');
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not sign in. Check your details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: IMAGES.authHero }} style={styles.hero} imageStyle={styles.heroImg}>
        <View style={styles.heroOverlay}>
          <Text style={styles.brand}>🎯 Precision Shooter</Text>
          <Text style={styles.tagline}>Train. Track. Compete.</Text>
        </View>
      </ImageBackground>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.form}
        >
          <Text style={styles.h1}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue</Text>

          {notice ? <Banner kind="error">{notice}</Banner> : null}
          {error ? <Banner kind="error">{error}</Banner> : null}
          {info ? <Banner kind="info">{info}</Banner> : null}

          <Field
            label="Email or Mobile"
            placeholder="you@example.com or 9990001111"
            autoCapitalize="none"
            value={identifier}
            onChangeText={(t) => {
              setIdentifier(t);
              if (notice) clearNotice();
            }}
          />
          <Field
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="Sign In" onPress={onSubmit} loading={loading} />
          <Link onPress={() => navigation.navigate('Register')}>New here? Create an account</Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  hero: { height: 260, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'flex-end' },
  heroImg: { opacity: 0.6 },
  heroOverlay: { padding: theme.spacing(3), backgroundColor: 'rgba(11,15,20,0.4)' },
  brand: { color: theme.colors.primary, fontSize: 26, fontWeight: '800' },
  tagline: { color: theme.colors.text, fontSize: 15, marginTop: 4 },
  form: { padding: theme.spacing(3), paddingBottom: theme.spacing(6) },
  h1: { color: theme.colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: theme.colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: theme.spacing(3) },
});
