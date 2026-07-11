// Month calendar that colors each day by attendance status. Tapping a marked
// day surfaces its status.
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

const STATUS_COLOR = {
  present: theme.colors.success,
  late: theme.colors.warning,
  absent: theme.colors.danger,
  excused: theme.colors.textMuted,
};
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AttendanceCalendar({ records = [] }) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [picked, setPicked] = useState(null);

  const byDate = useMemo(() => {
    const map = {};
    records.forEach((r) => { map[r.date] = r.status; });
    return map;
  }, [records]);

  const first = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const startDow = first.getDay();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const monthLabel = first.toLocaleString('default', { month: 'long', year: 'numeric' });
  const shift = (delta) => {
    setPicked(null);
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const fmt = (day) => `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={() => shift(-1)} hitSlop={10}><Text style={styles.nav}>‹</Text></Pressable>
        <Text style={styles.month}>{monthLabel}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={10}><Text style={styles.nav}>›</Text></Pressable>
      </View>

      <View style={styles.dowRow}>
        {DOW.map((d, i) => <Text key={i} style={styles.dow}>{d}</Text>)}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={i} style={styles.cell} />;
          const status = byDate[fmt(day)];
          const color = status ? STATUS_COLOR[status] : null;
          return (
            <Pressable
              key={i}
              style={styles.cell}
              onPress={() => status && setPicked({ day, status })}
            >
              <View style={[styles.dayDot, color && { backgroundColor: color + '33', borderColor: color, borderWidth: 1 }]}>
                <Text style={[styles.dayText, color && { color }]}>{day}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {picked ? (
        <Text style={styles.picked}>
          {monthLabel.split(' ')[0]} {picked.day}: <Text style={{ color: STATUS_COLOR[picked.status], fontWeight: '800', textTransform: 'capitalize' }}>{picked.status}</Text>
        </Text>
      ) : (
        <View style={styles.legend}>
          {Object.entries(STATUS_COLOR).slice(0, 3).map(([k, c]) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c }]} />
              <Text style={styles.legendText}>{k}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 12, marginBottom: theme.spacing(2) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, marginBottom: 10 },
  nav: { color: theme.colors.primary, fontSize: 28, fontWeight: '800', width: 32, textAlign: 'center' },
  month: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  dowRow: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  picked: { color: theme.colors.text, textAlign: 'center', marginTop: 8, fontSize: 14 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: theme.colors.textMuted, fontSize: 12, textTransform: 'capitalize' },
});
