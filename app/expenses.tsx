import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getReceipts, deleteReceipt } from '../lib/storage';
import { Receipt } from '../lib/types';
import ExpenseChart from '../components/ExpenseChart';

interface BarData {
  label: string;
  value: number;
}

function getWeekLabel(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function getMonthLabel(monthIndex: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
}

function buildWeeklyBars(receipts: Receipt[]): BarData[] {
  const now = new Date();
  const bars: BarData[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const total = receipts
      .filter((r) => r.date === dayStr)
      .reduce((sum, r) => sum + r.total, 0);
    bars.push({ label: getWeekLabel(day), value: total });
  }

  return bars;
}

function buildMonthlyBars(receipts: Receipt[]): BarData[] {
  const now = new Date();
  const bars: BarData[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const total = receipts
      .filter((r) => {
        const rd = new Date(r.date);
        return rd.getFullYear() === year && rd.getMonth() === month;
      })
      .reduce((sum, r) => sum + r.total, 0);
    bars.push({ label: getMonthLabel(month), value: total });
  }

  return bars;
}

export default function ExpensesScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'weekly' | 'monthly'>('weekly');

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [])
  );

  async function loadReceipts() {
    setLoading(true);
    const data = await getReceipts();
    // Sort newest first
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setReceipts(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    Alert.alert(
      'Delete Receipt',
      'Remove this receipt from expense history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteReceipt(id);
            setReceipts((prev) => prev.filter((r) => r.id !== id));
          },
        },
      ]
    );
  }

  // Computed stats
  const now = new Date();

  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const weekTotal = receipts
    .filter((r) => new Date(r.date) >= weekAgo)
    .reduce((sum, r) => sum + r.total, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTotal = receipts
    .filter((r) => new Date(r.date) >= monthStart)
    .reduce((sum, r) => sum + r.total, 0);

  const avgReceipt =
    receipts.length > 0
      ? receipts.reduce((sum, r) => sum + r.total, 0) / receipts.length
      : 0;

  const chartData =
    chartMode === 'weekly'
      ? buildWeeklyBars(receipts)
      : buildMonthlyBars(receipts);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Expenses</Text>

        {loading ? (
          <ActivityIndicator
            color="#2E7D32"
            style={{ marginTop: 40 }}
            accessibilityLabel="Loading expenses"
          />
        ) : (
          <>
            {/* Summary cards */}
            <View style={styles.statsRow}>
              <SummaryCard label="This Week" value={`$${weekTotal.toFixed(2)}`} />
              <SummaryCard label="This Month" value={`$${monthTotal.toFixed(2)}`} />
              <SummaryCard label="Avg Receipt" value={`$${avgReceipt.toFixed(2)}`} />
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Spending</Text>
                <View style={styles.chartToggle}>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      chartMode === 'weekly' && styles.toggleBtnActive,
                    ]}
                    onPress={() => setChartMode('weekly')}
                    accessibilityRole="button"
                    accessibilityLabel="Weekly view"
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        chartMode === 'weekly' && styles.toggleBtnTextActive,
                      ]}
                    >
                      Week
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      chartMode === 'monthly' && styles.toggleBtnActive,
                    ]}
                    onPress={() => setChartMode('monthly')}
                    accessibilityRole="button"
                    accessibilityLabel="Monthly view"
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        chartMode === 'monthly' && styles.toggleBtnTextActive,
                      ]}
                    >
                      6 Months
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <ExpenseChart data={chartData} />
            </View>

            {/* Receipt list */}
            <Text style={styles.listTitle}>
              Receipts ({receipts.length})
            </Text>

            {receipts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🧾</Text>
                <Text style={styles.emptyTitle}>No receipts yet</Text>
                <Text style={styles.emptyBody}>
                  Scan a receipt to start tracking your grocery spending.
                </Text>
              </View>
            ) : (
              receipts.map((receipt) => (
                <ReceiptRow
                  key={receipt.id}
                  receipt={receipt}
                  onDelete={() => handleDelete(receipt.id)}
                />
              ))
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ReceiptRow({
  receipt,
  onDelete,
}: {
  receipt: Receipt;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.receiptCard}>
      <TouchableOpacity
        style={styles.receiptHeader}
        onPress={() => setExpanded((v) => !v)}
        onLongPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`${receipt.store}, ${receipt.date}, total $${receipt.total.toFixed(2)}. Tap to expand, long press to delete.`}
      >
        <View style={styles.receiptLeft}>
          <Text style={styles.receiptStore} numberOfLines={1}>
            {receipt.store}
          </Text>
          <Text style={styles.receiptDate}>{receipt.date}</Text>
          <Text style={styles.receiptItems}>
            {receipt.items.length} item{receipt.items.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.receiptRight}>
          <Text style={styles.receiptTotal}>
            ${receipt.total.toFixed(2)}
          </Text>
          {receipt.tax > 0 && (
            <Text style={styles.receiptTax}>
              + ${receipt.tax.toFixed(2)} tax
            </Text>
          )}
          <Text style={styles.expandChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.receiptBody}>
          {receipt.items.map((item) => (
            <View key={item.id} style={styles.receiptItemRow}>
              <Text style={styles.receiptItemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.receiptItemQty}>{item.quantity}</Text>
              <Text style={styles.receiptItemPrice}>
                ${item.price.toFixed(2)}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={`Delete receipt from ${receipt.store}`}
          >
            <Text style={styles.deleteBtnText}>Delete Receipt</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 72,
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  // Chart
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minHeight: 30,
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#2E7D32',
  },
  // Receipt list
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 10,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  receiptHeader: {
    flexDirection: 'row',
    padding: 14,
    minHeight: 64,
    alignItems: 'center',
  },
  receiptLeft: {
    flex: 1,
  },
  receiptStore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 2,
  },
  receiptDate: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 1,
  },
  receiptItems: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  receiptRight: {
    alignItems: 'flex-end',
  },
  receiptTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
  },
  receiptTax: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  expandChevron: {
    fontSize: 11,
    color: '#BDBDBD',
    marginTop: 4,
  },
  receiptBody: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    padding: 14,
  },
  receiptItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  receiptItemName: {
    flex: 1,
    fontSize: 13,
    color: '#424242',
  },
  receiptItemQty: {
    fontSize: 12,
    color: '#9E9E9E',
    marginHorizontal: 8,
    minWidth: 40,
    textAlign: 'right',
  },
  receiptItemPrice: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '600',
    minWidth: 52,
    textAlign: 'right',
  },
  deleteBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});
