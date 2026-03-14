import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BarData {
  label: string;
  value: number;
}

interface Props {
  data: BarData[];
  maxValue?: number;
}

export default function ExpenseChart({ data, maxValue }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No expense data yet</Text>
      </View>
    );
  }

  const computedMax =
    maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container} accessibilityLabel="Expense bar chart">
      <View style={styles.chart}>
        {data.map((bar, i) => {
          const heightPct = computedMax > 0 ? bar.value / computedMax : 0;
          const barHeight = Math.max(heightPct * 120, bar.value > 0 ? 4 : 0);
          return (
            <View key={i} style={styles.barWrapper}>
              <Text style={styles.valueLabel}>
                {bar.value > 0 ? `$${bar.value.toFixed(0)}` : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor:
                        i === data.length - 1 ? '#2E7D32' : '#A5D6A7',
                    },
                  ]}
                  accessibilityLabel={`${bar.label}: $${bar.value.toFixed(2)}`}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {bar.label}
              </Text>
            </View>
          );
        })}
      </View>
      {/* Baseline */}
      <View style={styles.baseline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 3,
  },
  valueLabel: {
    fontSize: 10,
    color: '#424242',
    fontWeight: '600',
    marginBottom: 3,
    textAlign: 'center',
  },
  barTrack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 120,
  },
  bar: {
    width: '70%',
    borderRadius: 4,
    minWidth: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },
  baseline: {
    height: 1,
    backgroundColor: '#BDBDBD',
    marginTop: 0,
  },
  empty: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
});
