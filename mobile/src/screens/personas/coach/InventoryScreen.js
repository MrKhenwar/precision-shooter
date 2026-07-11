import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { createInventoryItem, getInventory } from '../../../api/academy';
import { Banner, Button, Field } from '../../../components/ui';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { theme } from '../../../theme';

const CATEGORIES = [
  ['rifle', 'Rifle'], ['pistol', 'Pistol'], ['cylinder', 'Cylinder'],
  ['jacket', 'Jacket'], ['trouser', 'Trousers'], ['other', 'Other'],
];
const CAT_LABEL = Object.fromEntries(CATEGORIES);

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('rifle');
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [expiry, setExpiry] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setItems(await getInventory());
    } catch (_) { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const alerts = useMemo(() => items.filter((i) => i.expiry_alert), [items]);

  async function onCreate() {
    setError(null);
    if (!name.trim()) { setError('Item name is required.'); return; }
    setSaving(true);
    try {
      const payload = { category, name: name.trim(), serial_number: serial };
      if (category === 'cylinder' && expiry.trim()) payload.cylinder_expiry = expiry.trim();
      await createInventoryItem(payload);
      setName(''); setSerial(''); setExpiry(''); setShowForm(false);
      await load();
    } catch (e) {
      const d = e.response?.data;
      setError(d?.detail || (d ? Object.values(d).flat().join(' ') : 'Could not add item.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  return (
    <KeyboardScreen>
        {alerts.length > 0 && (
          <Banner kind="error">
            {alerts.length} cylinder{alerts.length > 1 ? 's' : ''} nearing 10-year expiry — replace soon.
          </Banner>
        )}

        <Button
          title={showForm ? 'Cancel' : '+ Add Item'}
          variant={showForm ? 'ghost' : 'primary'}
          onPress={() => setShowForm((s) => !s)}
        />
        {showForm && (
          <View style={styles.form}>
            {error ? <Banner kind="error">{error}</Banner> : null}
            <Text style={styles.label}>Category</Text>
            <View style={styles.row}>
              {CATEGORIES.map(([v, lbl]) => {
                const active = category === v;
                return (
                  <Pressable key={v} onPress={() => setCategory(v)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{lbl}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field label="Name" placeholder="Walther LG400" value={name} onChangeText={setName} />
            <Field label="Serial number" value={serial} onChangeText={setSerial} />
            {category === 'cylinder' && (
              <Field label="Cylinder expiry (YYYY-MM-DD)" placeholder="2031-06-01" value={expiry} onChangeText={setExpiry} />
            )}
            <Button title="Add Item" onPress={onCreate} loading={saving} />
          </View>
        )}

        <Text style={styles.section}>Assets</Text>
        {items.length === 0 ? (
          <Text style={styles.empty}>No inventory yet.</Text>
        ) : (
          items.map((i) => (
            <View key={i.id} style={[styles.card, i.expiry_alert && styles.cardAlert]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{i.name}</Text>
                <Text style={styles.meta}>
                  {CAT_LABEL[i.category] || i.category}
                  {i.serial_number ? ` · SN ${i.serial_number}` : ''}
                  {i.assigned_to_name ? ` · ${i.assigned_to_name}` : ''}
                </Text>
                {i.cylinder_expiry ? (
                  <Text style={[styles.expiry, i.expiry_alert && { color: theme.colors.danger }]}>
                    Expires {i.cylinder_expiry}
                    {i.days_to_expiry != null ? ` (${i.days_to_expiry}d)` : ''}
                  </Text>
                ) : null}
              </View>
              {i.expiry_alert ? <Text style={styles.alertBadge}>⚠</Text> : null}
            </View>
          ))
        )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' },
  form: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginTop: theme.spacing(2) },
  label: { color: theme.colors.textMuted, marginBottom: 8, fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing(2) },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: theme.colors.primaryText },
  section: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: theme.spacing(3), marginBottom: theme.spacing(1) },
  empty: { color: theme.colors.textMuted },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 16, marginBottom: 10 },
  cardAlert: { borderColor: theme.colors.danger },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13 },
  expiry: { color: theme.colors.textMuted, marginTop: 4, fontSize: 12, fontWeight: '600' },
  alertBadge: { fontSize: 22, marginLeft: 8 },
});
