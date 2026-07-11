// Colored circular progress ring with a centered value.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { theme } from '../theme';

export function StatRing({
  value = 0,
  max = 100,
  size = 86,
  stroke = 8,
  color = theme.colors.primary,
  centerText,
  label,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const dash = c * pct;

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.border} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.center}>
          <Text style={[styles.value, { color }]}>{centerText ?? `${Math.round(pct * 100)}%`}</Text>
        </View>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 18, fontWeight: '800' },
  label: { color: theme.colors.textMuted, fontSize: 11, marginTop: 6, textAlign: 'center' },
});
