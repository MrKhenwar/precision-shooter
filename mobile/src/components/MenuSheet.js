// Slide-in hamburger menu. `items` = [{ icon, label, color, onPress, danger }].
// Rendered as a left drawer over a dimmed backdrop.
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { IconTile } from './kit';

export function MenuSheet({ visible, onClose, title = 'Menu', subtitle, items = [] }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.panel, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={{ marginTop: 8 }}>
          {items.map((it) => (
            <Pressable
              key={it.label}
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: theme.colors.surfaceAlt }]}
              onPress={() => { onClose(); setTimeout(() => it.onPress && it.onPress(), 180); }}
            >
              <IconTile icon={it.icon} color={it.color || theme.colors.primary} size={40} iconSize={20} />
              <Text style={[styles.itemLabel, it.danger && { color: theme.colors.danger }]}>{it.label}</Text>
              {!it.danger ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} /> : null}
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    width: '82%', maxWidth: 340,
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1, borderRightColor: theme.colors.border,
    paddingHorizontal: theme.spacing(2),
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing(2), borderBottomWidth: 1, borderBottomColor: theme.colors.borderSoft },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: theme.colors.primary, fontSize: 13, marginTop: 3, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  itemLabel: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '600', marginLeft: 14 },
});
