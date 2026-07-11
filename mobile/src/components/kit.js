// Reference design-system primitives shared across all Precision Shooter
// screens: cards, headers, segmented tabs, avatars, badges, checklist rows,
// stat tiles and quick-action tiles. Everything follows the dark-navy / blue
// look of the reference mockup.
//
// Polish pass: shimmer skeleton loaders (NFR-003), input focus rings, pressed
// scale feedback on buttons/cards, softer shadows and tinted empty states.
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../theme';

// -------------------------------------------------------------- Form field
export function Field({ label, error, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textFaint}
        onFocus={(e) => { setFocused(true); props.onFocus && props.onFocus(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur && props.onBlur(e); }}
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error && { borderColor: theme.colors.danger },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// -------------------------------------------------------------- Button
export function Button({ title, onPress, loading, disabled, variant = 'primary', icon, style }) {
  const ghost = variant === 'ghost';
  const danger = variant === 'danger';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.btn,
        ghost ? styles.btnGhost : danger ? styles.btnDanger : styles.btnPrimary,
        (loading || disabled) && { opacity: 0.55 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={ghost ? theme.colors.text : '#fff'} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon ? <Ionicons name={icon} size={18} color={ghost ? theme.colors.text : '#fff'} /> : null}
          <Text style={[styles.btnText, ghost && { color: theme.colors.text }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

// -------------------------------------------------------------- Chip select
export function ChipSelect({ label, options, value, onChange, multi = false }) {
  const selected = multi ? (Array.isArray(value) ? value : []) : value;
  const isOn = (v) => (multi ? selected.includes(v) : selected === v);
  const toggle = (v) => {
    if (multi) onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
    else onChange(v);
  };
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.chipWrap}>
        {options.map((o) => {
          const on = isOn(o.value);
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => toggle(o.value)}
              style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.chipText, on && { color: '#fff' }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// -------------------------------------------------------------- Banner
export function Banner({ children, kind = 'info' }) {
  const map = {
    error: { c: theme.colors.danger, bg: theme.colors.dangerDim, icon: 'alert-circle' },
    success: { c: theme.colors.success, bg: theme.colors.successDim, icon: 'checkmark-circle' },
    info: { c: theme.colors.primary, bg: theme.colors.primaryDim, icon: 'information-circle' },
  };
  const s = map[kind] || map.info;
  return (
    <View style={[styles.banner, { backgroundColor: s.bg, borderColor: withAlpha(s.c, 0.35) }]}>
      <Ionicons name={s.icon} size={16} color={s.c} style={{ marginRight: 8, marginTop: 1 }} />
      <Text style={{ color: s.c, fontSize: 13, flex: 1, lineHeight: 18 }}>{children}</Text>
    </View>
  );
}

// ---------------------------------------------------- Skeleton (shimmer bar)
// Building block for loading states; pulses between two opacities.
export function Skeleton({ width = '100%', height = 14, radius = 8, style }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 620, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 620, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.colors.surfaceAlt, opacity: pulse },
        style,
      ]}
    />
  );
}

// A ready-made skeleton card (title bar + two lines).
export function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, styles.cardPad, style]}>
      <Skeleton width="46%" height={16} />
      <Skeleton width="100%" height={12} style={{ marginTop: 14 }} />
      <Skeleton width="72%" height={12} style={{ marginTop: 10 }} />
    </View>
  );
}

// -------------------------------------------------------------- Loading state
// Skeleton layout instead of a spinner (NFR-003) — screens keep calling
// <Loading /> and instantly get the shimmer treatment.
export function Loading({ label }) {
  return (
    <View style={styles.loadingWrap}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <View style={[styles.card, styles.cardPad, { flex: 1 }]}>
          <Skeleton width="60%" height={12} />
          <Skeleton width="40%" height={20} style={{ marginTop: 12 }} />
        </View>
        <View style={[styles.card, styles.cardPad, { flex: 1 }]}>
          <Skeleton width="60%" height={12} />
          <Skeleton width="40%" height={20} style={{ marginTop: 12 }} />
        </View>
      </View>
      <SkeletonCard />
      <SkeletonCard style={{ marginTop: 12 }} />
      {label ? <Text style={styles.centeredText}>{label}</Text> : null}
    </View>
  );
}

// --------------------------------------------------------------- Empty state
export function EmptyState({ icon = 'file-tray-outline', title, sub }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={30} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------- Screen shell
export function Screen({ children, scroll = true, edges = ['top'], contentStyle }) {
  const Inner = scroll ? ScrollView : View;
  const innerProps = scroll
    ? { contentContainerStyle: [styles.scrollContent, contentStyle], showsVerticalScrollIndicator: false }
    : { style: [{ flex: 1 }, contentStyle] };
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <Inner {...innerProps}>{children}</Inner>
    </SafeAreaView>
  );
}

// -------------------------------------------------------------------- Card
export function Card({ children, style, onPress, padded = true }) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp
      onPress={onPress}
      style={({ pressed } = {}) => [
        styles.card,
        padded && styles.cardPad,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      {children}
    </Comp>
  );
}

// ------------------------------------------------------------- Screen header
export function Header({ title, left = 'back', onLeft, right, onRight, rightIcon }) {
  return (
    <View style={styles.header}>
      {left ? (
        <Pressable
          onPress={onLeft}
          hitSlop={10}
          style={({ pressed }) => [styles.headerBtn, styles.headerBtnCircle, pressed && { opacity: 0.7 }]}
        >
          <Ionicons
            name={left === 'menu' ? 'menu' : 'chevron-back'}
            size={22}
            color={theme.colors.text}
          />
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      {right ? (
        <Pressable
          onPress={onRight}
          hitSlop={10}
          style={({ pressed }) => [styles.headerBtn, styles.headerBtnCircle, pressed && { opacity: 0.7 }]}
        >
          {typeof right === 'string' ? (
            <Ionicons name={right} size={21} color={theme.colors.text} />
          ) : (
            right
          )}
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );
}

// -------------------------------------------------------- Segmented pill tabs
export function SegTabs({ items, value, onChange, style }) {
  return (
    <View style={[styles.seg, style]}>
      {items.map((it) => {
        const key = typeof it === 'string' ? it : it.value;
        const label = typeof it === 'string' ? it : it.label;
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange && onChange(key)}
            style={({ pressed }) => [styles.segItem, active && styles.segItemActive, pressed && !active && { opacity: 0.7 }]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// -------------------------------------------------------------------- Avatar
export function Avatar({ uri, size = 56, ring }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        ring && { borderWidth: 2, borderColor: ring },
      ]}
    >
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.surfaceAlt }}
      />
    </View>
  );
}

// -------------------------------------------------------------------- Badge
export function Badge({ label, color = theme.colors.gold, bg }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg || withAlpha(color, 0.16) }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ----------------------------------------------------------- Section heading
export function SectionTitle({ children, action, onAction, style }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------ Icon tile (rounded)
export function IconTile({ icon, color = theme.colors.primary, size = 46, iconSize = 22, family = Ionicons }) {
  const Fam = family;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: withAlpha(color, 0.16),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Fam name={icon} size={iconSize} color={color} />
    </View>
  );
}

// ---------------------------------------------------- Checklist / plan row
export function ChecklistRow({ label, meta, done, accent = theme.colors.success, last }) {
  return (
    <View style={[styles.checkRow, !last && styles.checkRowBorder]}>
      <Ionicons
        name={done ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={done ? accent : theme.colors.textFaint}
      />
      <Text style={[styles.checkLabel, !done && { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={styles.checkMeta}>{meta}</Text>
    </View>
  );
}

// ----------------------------------------------------------- Info list row
export function InfoRow({ icon, label, value, last, family = Ionicons }) {
  const Fam = family;
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Fam name={icon} size={18} color={theme.colors.textMuted} style={{ width: 26 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// helper: hex + alpha
export function withAlpha(hex, alpha) {
  if (hex.startsWith('rgba')) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },

  fieldLabel: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  field: {
    backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: theme.radiusSm, color: theme.colors.text, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  fieldFocused: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt },
  fieldError: { color: theme.colors.danger, fontSize: 12, marginTop: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.colors.surface },
  chipOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  btn: { borderRadius: theme.radius, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnDanger: { backgroundColor: theme.colors.danger },
  btnGhost: { borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: theme.radiusSm, borderWidth: 1, padding: 12, marginBottom: 12 },

  loadingWrap: { padding: theme.spacing(2) },
  centeredText: { color: theme.colors.textMuted, fontSize: 13, marginTop: 14, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: theme.spacing(5) },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primaryDim,
  },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptySub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19, paddingHorizontal: 24 },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardPad: { padding: theme.spacing(2) },
  cardPressed: { transform: [{ scale: 0.985 }], borderColor: theme.colors.textFaint, opacity: 0.92 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1.5),
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnCircle: {
    borderRadius: 20, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  headerTitle: { flex: 1, textAlign: 'center', color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },

  seg: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
  },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center' },
  segItemActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  segText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  segTextActive: { color: '#fff', fontWeight: '700' },

  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2.5),
    marginBottom: theme.spacing(1.5),
  },
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  sectionAction: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },

  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  checkRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderSoft },
  checkLabel: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '500', marginLeft: 12 },
  checkMeta: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '500' },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderSoft },
  infoLabel: { flex: 1, color: theme.colors.textMuted, fontSize: 14, marginLeft: 4 },
  infoValue: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
});
