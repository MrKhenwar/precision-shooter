// Month calendar grid. `marks` maps ISO date -> dot colour; `selected` is the
// active ISO date. Weeks start on Monday.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme as t } from '../theme';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const iso = (d) => d.toISOString().slice(0, 10);

export function Calendar({ month, marks = {}, selected, onSelect, onPrev, onNext }) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const startOffset = (first.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const title = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Pressable onPress={onPrev} hitSlop={10}><Ionicons name="chevron-back" size={20} color={t.colors.textMuted} /></Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onNext} hitSlop={10}><Ionicons name="chevron-forward" size={20} color={t.colors.textMuted} /></Pressable>
      </View>

      <View style={styles.row}>
        {DOW.map((d) => <Text key={d} style={styles.dow}>{d}</Text>)}
      </View>

      {chunk(cells, 7).map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.cell} />;
            const key = iso(day);
            const isSel = key === selected;
            const mark = marks[key];
            return (
              <Pressable key={di} style={styles.cell} onPress={() => onSelect && onSelect(key)}>
                <View style={[styles.dayWrap, isSel && styles.daySel]}>
                  <Text style={[styles.dayText, isSel && styles.dayTextSel]}>{day.getDate()}</Text>
                </View>
                {mark && !isSel ? <View style={[styles.dot, { backgroundColor: mark }]} /> : <View style={styles.dot} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const styles = StyleSheet.create({
  card: { backgroundColor: t.colors.surface, borderRadius: t.radius, borderWidth: 1, borderColor: t.colors.border, padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 10 },
  title: { color: t.colors.text, fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', color: t.colors.textFaint, fontSize: 11, fontWeight: '600', marginBottom: 6 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  daySel: { backgroundColor: t.colors.primary },
  dayText: { color: t.colors.text, fontSize: 14, fontWeight: '500' },
  dayTextSel: { color: '#fff', fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3, backgroundColor: 'transparent' },
});
