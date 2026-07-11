// Inline chip selector for enum fields (gender, discipline, diet, etc.).
// Avoids extra native picker deps and works identically on web and native.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

export function Select({ label, value, options, onChange }) {
  return (
    <View style={{ marginBottom: theme.spacing(2) }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.colors.textMuted, marginBottom: 8, fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: theme.colors.primaryText },
});

// Shared option lists mirroring the backend BFR enums.
export const OPTIONS = {
  gender: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ],
  discipline: [
    { value: 'air_rifle', label: '10m Air Rifle' },
    { value: 'air_pistol', label: '10m Air Pistol' },
  ],
  dominant_hand: [
    { value: 'RH', label: 'Right' },
    { value: 'LH', label: 'Left' },
  ],
  dominant_eye: [
    { value: 'right', label: 'Right' },
    { value: 'left', label: 'Left' },
    { value: 'cross', label: 'Cross-Dominant' },
  ],
  diet_type: [
    { value: 'veg', label: 'Veg' },
    { value: 'non_veg', label: 'Non-Veg' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'eggetarian', label: 'Eggetarian' },
  ],
};

export const TIER_LABELS = {
  rookie: 'Rookie',
  novice: 'Novice',
  marksman: 'Marksman',
  sharpshooter: 'Sharpshooter',
  district: 'District / Pre-State',
  state: 'State Qualified',
  zone: 'Zone Qualified',
  national: 'National Qualified',
  trial: 'Trial Qualified',
  national_team: 'National Team',
};
