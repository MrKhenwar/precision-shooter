// Modal dropdown picker. Works identically on web and native and never sits
// behind the keyboard (it's an overlay).
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

export function Dropdown({ label, value, options, onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ marginBottom: theme.spacing(2) }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.control} onPress={() => setOpen(true)}>
        <Text style={[styles.controlText, !selected && { color: theme.colors.textMuted }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                    {active ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.colors.textMuted, marginBottom: 6, fontSize: 13 },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  controlText: { color: theme.colors.text, fontSize: 16 },
  caret: { color: theme.colors.textMuted, fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: '70%',
    paddingVertical: 8,
  },
  sheetTitle: { color: theme.colors.textMuted, fontSize: 13, paddingHorizontal: 16, paddingVertical: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionActive: { backgroundColor: theme.colors.surfaceAlt },
  optionText: { color: theme.colors.text, fontSize: 16 },
  optionTextActive: { color: theme.colors.primary, fontWeight: '700' },
  check: { color: theme.colors.primary, fontWeight: '800' },
});

// Build the last `back` months + `fwd` future months as YYYY-MM options.
export function monthOptions(back = 11, fwd = 1) {
  const opts = [];
  const now = new Date();
  for (let i = -fwd; i <= back; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    opts.push({ value, label });
  }
  return opts;
}
