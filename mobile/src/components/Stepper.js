// 0-10 score stepper used by evaluations and the diary.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

export function Stepper({ label, value, onChange, min = 0, max = 10 }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable onPress={dec} style={styles.btn} hitSlop={6}>
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable onPress={inc} style={styles.btn} hitSlop={6}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: { color: theme.colors.text, fontSize: 15, flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: theme.colors.primary, fontSize: 22, fontWeight: '700', lineHeight: 24 },
  value: { color: theme.colors.text, fontSize: 18, fontWeight: '800', width: 28, textAlign: 'center' },
});
