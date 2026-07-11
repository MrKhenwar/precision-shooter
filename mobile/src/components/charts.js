// SVG data-viz used on the performance screens: a progress Ring, a smooth
// Score-Trend line chart and the Shot-Distribution target plot.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polyline,
  Stop,
} from 'react-native-svg';

import { theme } from '../theme';

// -------------------------------------------------------------- Progress ring
export function Ring({ value = 0, size = 84, stroke = 9, color = theme.colors.primary, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / 100, 0), 1);
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.surfaceAlt} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c * pct} ${c}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.ringValue, { color }]}>{Math.round(value)}%</Text>
          </View>
        </View>
      </View>
      {label ? <Text style={styles.ringLabel}>{label}</Text> : null}
    </View>
  );
}

// ------------------------------------------------------------- Score trend line
export function LineChart({
  data = [],
  width = 300,
  height = 150,
  color = theme.colors.primary,
  min = 6,
  max = 10,
  yTicks = [6, 7, 8, 9, 10],
  xLabels = [],
  highlightLast = true,
}) {
  const padL = 26;
  const padR = 12;
  const padT = 10;
  const padB = 22;
  const iw = width - padL - padR;
  const ih = height - padT - padB;
  const n = data.length;
  const x = (i) => padL + (n <= 1 ? 0 : (i / (n - 1)) * iw);
  const y = (v) => padT + ih - ((v - min) / (max - min)) * ih;
  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const last = data[n - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.28" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* grid + y labels */}
      {yTicks.map((t) => (
        <G key={t}>
          <Line x1={padL} y1={y(t)} x2={width - padR} y2={y(t)} stroke={theme.colors.borderSoft} strokeWidth={1} />
        </G>
      ))}
      {yTicks.map((t) => (
        <SvgText key={`l${t}`} x={4} y={y(t) + 4} fill={theme.colors.textFaint} fontSize={9}>
          {t}
        </SvgText>
      ))}
      {/* area fill */}
      {n > 1 ? (
        <Path
          d={`M ${x(0)} ${y(data[0])} ${data
            .map((v, i) => `L ${x(i)} ${y(v)}`)
            .join(' ')} L ${x(n - 1)} ${padT + ih} L ${x(0)} ${padT + ih} Z`}
          fill="url(#lc)"
        />
      ) : null}
      {/* line */}
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* dots */}
      {data.map((v, i) => (
        <Circle key={i} cx={x(i)} cy={y(v)} r={2.6} fill={color} />
      ))}
      {/* highlight last value */}
      {highlightLast && n > 0 ? (
        <G>
          <Circle cx={x(n - 1)} cy={y(last)} r={4.5} fill={color} stroke="#fff" strokeWidth={1.5} />
          <SvgText x={x(n - 1) - 4} y={y(last) - 8} fill={theme.colors.text} fontSize={11} fontWeight="700" textAnchor="end">
            {last.toFixed(1)}
          </SvgText>
        </G>
      ) : null}
      {/* x labels */}
      {xLabels.map((lbl, i) => (
        <SvgText
          key={`x${i}`}
          x={x(Math.round((i / (xLabels.length - 1)) * (n - 1)))}
          y={height - 6}
          fill={theme.colors.textFaint}
          fontSize={9}
          textAnchor="middle"
        >
          {lbl}
        </SvgText>
      ))}
    </Svg>
  );
}

// react-native-svg Text needs importing under an alias to avoid RN Text clash.
import { Text as SvgTextRaw } from 'react-native-svg';
function SvgText(props) {
  return <SvgTextRaw {...props} />;
}

// ------------------------------------------------------------ Shot distribution
export function TargetPlot({ shots = [], size = 150 }) {
  const cx = size / 2;
  const cy = size / 2;
  const rings = [1, 0.8, 0.62, 0.44, 0.26];
  return (
    <Svg width={size} height={size}>
      {rings.map((f, i) => (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={(size / 2 - 4) * f}
          fill="none"
          stroke={theme.colors.border}
          strokeWidth={1}
        />
      ))}
      <Circle cx={cx} cy={cy} r={(size / 2 - 4) * 0.13} fill={theme.colors.surfaceAlt} />
      {shots.map((s, i) => (
        <Circle
          key={i}
          cx={cx + s.x * (size / 2 - 8)}
          cy={cy + s.y * (size / 2 - 8)}
          r={2.6}
          fill={s.color}
          opacity={0.9}
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  ringValue: { fontSize: 20, fontWeight: '800' },
  ringLabel: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8 },
});
