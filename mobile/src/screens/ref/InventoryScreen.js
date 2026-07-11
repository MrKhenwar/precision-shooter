// Inventory — live kit/cylinder tracking + add item (FR-013).
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Banner, Button, ChipSelect, EmptyState, Field, Header, IconTile, Loading } from '../../components/kit';
import { cap, fmtDate } from './labels';
import { createInventoryItem, getInventory } from '../../api/academy';
import { theme } from '../../theme';

const CATEGORIES = [
  { value: 'rifle', label: 'Air Rifle' }, { value: 'pistol', label: 'Air Pistol' },
  { value: 'cylinder', label: 'Cylinder' }, { value: 'jacket', label: 'Jacket' },
  { value: 'trouser', label: 'Trousers' }, { value: 'other', label: 'Other' },
];

export default function InventoryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ category: 'rifle', name: '', serial_number: '', cylinder_expiry: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    getInventory().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  async function create() {
    setError(null);
    if (!f.name.trim()) return setError('Item name is required.');
    if (f.cylinder_expiry && !/^\d{4}-\d{2}-\d{2}$/.test(f.cylinder_expiry)) return setError('Expiry must be YYYY-MM-DD.');
    setSaving(true);
    try {
      await createInventoryItem({
        category: f.category, name: f.name.trim(), serial_number: f.serial_number,
        cylinder_expiry: f.cylinder_expiry || null, notes: f.notes,
      });
      setF({ category: 'rifle', name: '', serial_number: '', cylinder_expiry: '', notes: '' });
      setShow(false);
      load();
    } catch (e) { setError(e.response?.data?.detail || 'Could not add item.'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Inventory" onLeft={() => navigation.goBack()} right={show ? 'close' : 'add'} onRight={() => setShow((s) => !s)} />
      {loading ? <Loading /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {show && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Add Item</Text>
                {error ? <Banner kind="error">{error}</Banner> : null}
                <ChipSelect label="Category" options={CATEGORIES} value={f.category} onChange={set('category')} />
                <Field label="Name" placeholder="e.g. Walther LG400" value={f.name} onChangeText={set('name')} />
                <Field label="Serial Number" value={f.serial_number} onChangeText={set('serial_number')} autoCapitalize="characters" />
                {f.category === 'cylinder' ? <Field label="Cylinder Expiry (YYYY-MM-DD)" placeholder="2034-01-01" value={f.cylinder_expiry} onChangeText={set('cylinder_expiry')} autoCapitalize="none" /> : null}
                <Field label="Condition Notes" value={f.notes} onChangeText={set('notes')} multiline />
                <Button title="Add Item" icon="add-circle" onPress={create} loading={saving} />
              </View>
            )}

            {items.length === 0 && !show ? (
              <EmptyState icon="cube-outline" title="No inventory" sub="Tap + to add kit or cylinders." />
            ) : items.map((it) => (
              <View key={it.id} style={styles.card}>
                <IconTile icon="cube" color={it.expiry_alert ? theme.colors.danger : theme.colors.cyan} size={46} iconSize={22} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.name}>{it.name}</Text>
                  <Text style={styles.sub}>{cap(it.category)}{it.serial_number ? ` · ${it.serial_number}` : ''}{it.cylinder_expiry ? ` · Exp ${fmtDate(it.cylinder_expiry)}` : ''}</Text>
                </View>
                {it.expiry_alert ? <Badge label={`${it.days_to_expiry}d`} color={theme.colors.danger} /> : null}
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  form: { backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 16 },
  formTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
});
