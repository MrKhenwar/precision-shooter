// Shared persona dashboard shell: image header (+ profile button), colored
// stat rings, an urgent highlight banner, quick actions, and module cards with
// live preview stats.
import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { StatRing } from '../../components/StatRing';
import { useAuth } from '../../store/AuthContext';
import { PERSONA_BANNER } from '../../images';
import { PERSONAS, theme } from '../../theme';

export function DashboardShell({
  title,
  rings = [],
  urgent = null,
  quickActions = [],
  modules = [],
  onProfile = null,
  profileLabel = 'Profile',
}) {
  const { user, signOut } = useAuth();
  const banner = PERSONA_BANNER[user?.persona];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing(4) }}>
        <ImageBackground source={banner ? { uri: banner } : undefined} style={styles.banner} imageStyle={styles.bannerImage}>
          <View style={styles.bannerOverlay}>
            <Text style={styles.brand}>🎯 Precision Shooter</Text>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hello}>{user?.full_name || user?.email || user?.mobile}</Text>
                <Text style={styles.role}>{PERSONAS[user?.persona] || 'User'}</Text>
              </View>
              {onProfile ? (
                <Pressable onPress={onProfile} style={styles.profileBtn}>
                  <Text style={styles.profileBtnText}>{profileLabel}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          {/* Colored stat rings */}
          {rings.length > 0 && (
            <View style={styles.ringsCard}>
              {rings.map((r, i) => (
                <StatRing
                  key={i}
                  value={r.value}
                  max={r.max}
                  color={r.color}
                  centerText={r.centerText}
                  label={r.label}
                  size={r.size || 78}
                />
              ))}
            </View>
          )}

          {/* Urgent highlight (e.g., next training) */}
          {urgent && (
            <Pressable
              onPress={urgent.onPress}
              style={[styles.urgent, { borderLeftColor: urgent.accent || theme.colors.primary }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.urgentKicker}>{urgent.kicker || 'UP NEXT'}</Text>
                <Text style={styles.urgentTitle}>{urgent.title}</Text>
                {urgent.subtitle ? <Text style={styles.urgentSub}>{urgent.subtitle}</Text> : null}
              </View>
              {urgent.badge ? (
                <View style={[styles.urgentBadge, { backgroundColor: urgent.accent || theme.colors.primary }]}>
                  <Text style={styles.urgentBadgeText}>{urgent.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          )}

          {/* Quick actions */}
          {quickActions.length > 0 && (
            <View style={styles.quickRow}>
              {quickActions.map((a) => (
                <Pressable key={a.label} onPress={a.onPress} style={[styles.quick, { borderColor: a.color || theme.colors.primary }]}>
                  <Text style={[styles.quickText, { color: a.color || theme.colors.primary }]}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.section}>{title}</Text>

          {modules.map((m) => {
            const tappable = !!m.onPress && !m.soon;
            const Wrapper = tappable ? Pressable : View;
            return (
              <Wrapper
                key={m.title}
                onPress={m.onPress}
                style={({ pressed } = {}) => [
                  styles.module,
                  m.accent && { borderLeftWidth: 3, borderLeftColor: m.accent },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.moduleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.moduleTitle}>{m.title}</Text>
                    <Text style={styles.moduleDesc}>{m.desc}</Text>
                    {m.soon ? <Text style={styles.badge}>Coming soon</Text> : null}
                  </View>
                  {m.stat != null ? (
                    <View style={[styles.statPill, { backgroundColor: (m.statColor || theme.colors.primary) + '22', borderColor: m.statColor || theme.colors.primary }]}>
                      <Text style={[styles.statPillText, { color: m.statColor || theme.colors.primary }]}>{m.stat}</Text>
                    </View>
                  ) : tappable ? (
                    <Text style={styles.chevron}>›</Text>
                  ) : null}
                </View>
              </Wrapper>
            );
          })}

          <View style={{ marginTop: theme.spacing(3) }}>
            <Button title="Sign out" variant="ghost" onPress={signOut} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  body: { padding: theme.spacing(2) },
  banner: { height: 172, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'flex-end' },
  bannerImage: { opacity: 0.55 },
  bannerOverlay: { padding: theme.spacing(2), backgroundColor: 'rgba(11,15,20,0.4)' },
  brand: { color: theme.colors.primary, fontWeight: '800', fontSize: 13, marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  hello: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  role: { color: theme.colors.primary, fontWeight: '600', marginTop: 2 },
  profileBtn: { backgroundColor: theme.colors.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  profileBtnText: { color: theme.colors.primaryText, fontWeight: '800', fontSize: 13 },

  ringsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    paddingVertical: 16,
    marginBottom: theme.spacing(2),
  },

  urgent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: theme.radius,
    padding: 16,
    marginBottom: theme.spacing(2),
  },
  urgentKicker: { color: theme.colors.warning, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  urgentTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
  urgentSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  urgentBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 10 },
  urgentBadgeText: { color: theme.colors.primaryText, fontWeight: '800', fontSize: 13 },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing(2) },
  quick: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  quickText: { fontWeight: '700', fontSize: 13 },

  section: { color: theme.colors.textMuted, fontSize: 13, marginBottom: theme.spacing(1), textTransform: 'uppercase', letterSpacing: 1 },
  module: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 10,
  },
  moduleRow: { flexDirection: 'row', alignItems: 'center' },
  chevron: { color: theme.colors.textMuted, fontSize: 28, marginLeft: 8 },
  moduleTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  moduleDesc: { color: theme.colors.textMuted, marginTop: 4, fontSize: 13 },
  statPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 10, minWidth: 52, alignItems: 'center' },
  statPillText: { fontWeight: '800', fontSize: 14 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    color: theme.colors.warning,
    borderColor: theme.colors.warning,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
  },
});
