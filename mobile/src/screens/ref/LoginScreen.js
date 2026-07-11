// Splash / login — full-bleed background image with a dark scrim, brand mark,
// primary Login, outline Register, and a "Continue as Guest" link.
import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';

// Full-screen background. Replace assets/login-bg.png to change the artwork.
const LOGIN_BG = require('../../../assets/login-bg.png');

export default function LoginScreen({ navigation }) {
  return (
    <ImageBackground source={LOGIN_BG} style={styles.bg} resizeMode="cover">
      {/* Dark scrim so brand + buttons stay legible over any image */}
      <View style={styles.scrim} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Ionicons name="locate" size={30} color={theme.colors.primary} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.brand}>PRECISION</Text>
              <Text style={styles.brand}>SHOOTER</Text>
              <Text style={styles.tagline}>TRAIN. ANALYZE. EXCEL.</Text>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.primaryBtnText}>Login</Text>
            </Pressable>
            <Pressable style={styles.outlineBtn} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.outlineBtnText}>Register</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('SignIn')} hitSlop={8}>
              <Text style={styles.guest}>Continue as Guest</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,14,20,0.55)' },
  safe: { flex: 1 },
  container: { flex: 1, padding: theme.spacing(3), paddingBottom: theme.spacing(4) },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing(1) },
  logoMark: {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: 'rgba(20,27,38,0.7)',
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 1, lineHeight: 24 },
  tagline: { color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 4 },

  actions: { gap: 14 },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    borderRadius: theme.radius,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(20,27,38,0.35)',
  },
  outlineBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  guest: { color: '#dfe6f2', textAlign: 'center', fontSize: 14, textDecorationLine: 'underline', marginTop: 2 },
});
