// Small set of themed UI primitives reused across screens.
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { theme } from '../theme';

export function Screen({ children, style }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Heading({ children, sub }) {
  return (
    <View style={{ marginBottom: theme.spacing(3) }}>
      <Text style={styles.h1}>{children}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export function Field({ label, error, ...props }) {
  return (
    <View style={{ marginBottom: theme.spacing(2) }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, error && { borderColor: theme.colors.danger }]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnGhost,
        (loading || disabled) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.primaryText : theme.colors.text} />
      ) : (
        <Text style={[styles.btnText, !isPrimary && { color: theme.colors.text }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Banner({ children, kind = 'info' }) {
  const color =
    kind === 'error'
      ? theme.colors.danger
      : kind === 'success'
      ? theme.colors.success
      : theme.colors.primary;
  return (
    <View style={[styles.banner, { borderColor: color }]}>
      <Text style={{ color: theme.colors.text }}>{children}</Text>
    </View>
  );
}

export function Link({ children, onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={styles.link}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing(3),
    justifyContent: 'center',
  },
  h1: { color: theme.colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: theme.colors.textMuted, fontSize: 14, marginTop: 4 },
  label: { color: theme.colors.textMuted, marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    color: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: { color: theme.colors.danger, marginTop: 4, fontSize: 12 },
  btn: {
    borderRadius: theme.radius,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing(1),
  },
  btnPrimary: { backgroundColor: theme.colors.primary },
  btnGhost: { borderWidth: 1, borderColor: theme.colors.border },
  btnText: { color: theme.colors.primaryText, fontWeight: '700', fontSize: 16 },
  banner: {
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 12,
    marginBottom: theme.spacing(2),
    backgroundColor: theme.colors.surface,
  },
  link: { color: theme.colors.primary, fontWeight: '600', textAlign: 'center', marginTop: 16 },
});
