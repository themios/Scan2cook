import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getPantry, getReceipts, savePantry, saveReceipt, clearAllData } from '../lib/storage';
import { PantryItem, Receipt, Recipe } from '../lib/types';
import { DEMO_PANTRY_ITEMS, DEMO_RECEIPT, DEMO_RECIPES } from '../lib/demo';
import RecipeCard from '../components/RecipeCard';

export default function HomeScreen() {
  const router = useRouter();
  const [pantryCount, setPantryCount] = useState(0);
  const [weekSpend, setWeekSpend] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setLoading(true);
    try {
      const [pantry, receipts] = await Promise.all([getPantry(), getReceipts()]);

      setPantryCount(pantry.length);

      // Expiring within 7 days
      const now = new Date();
      const expiring = pantry.filter((item) => {
        const exp = new Date(item.estimatedExpiration);
        const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      });
      setExpiringCount(expiring.length);

      // This week's spend
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekTotal = receipts
        .filter((r) => new Date(r.date) >= weekAgo)
        .reduce((sum, r) => sum + r.total, 0);
      setWeekSpend(weekTotal);

      // Show demo recipes on home if available
      setFeaturedRecipes(DEMO_RECIPES.slice(0, 2));
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadDemo() {
    Alert.alert(
      'Load Demo Data',
      'This will add sample pantry items and a receipt so you can explore the app. Any existing data will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Demo',
          onPress: async () => {
            setLoadingDemo(true);
            try {
              // Add demo items without clearing existing
              const existing = await getPantry();
              const merged = [...existing];
              for (const item of DEMO_PANTRY_ITEMS) {
                if (!merged.find((e) => e.id === item.id)) {
                  merged.push(item);
                }
              }
              await savePantry(merged);
              await saveReceipt(DEMO_RECEIPT);
              await loadData();
              Alert.alert('Done', 'Demo data loaded! Check Pantry and Expenses tabs.');
            } finally {
              setLoadingDemo(false);
            }
          },
        },
      ]
    );
  }

  async function handleClearData() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all pantry items and receipts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await loadData();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Receipt2Pantry</Text>
          <TouchableOpacity
            onPress={handleClearData}
            style={styles.settingsBtn}
            accessibilityLabel="Clear all data"
            accessibilityRole="button"
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        {loading ? (
          <ActivityIndicator
            color="#2E7D32"
            style={{ marginVertical: 24 }}
            accessibilityLabel="Loading stats"
          />
        ) : (
          <View style={styles.statsRow}>
            <StatCard
              value={String(pantryCount)}
              label="Pantry Items"
              icon="🥫"
              onPress={() => router.push('/pantry')}
            />
            <StatCard
              value={`$${weekSpend.toFixed(0)}`}
              label="This Week"
              icon="💰"
              onPress={() => router.push('/expenses')}
            />
            <StatCard
              value={String(expiringCount)}
              label="Expiring Soon"
              icon="⏰"
              accent={expiringCount > 0}
              onPress={() => router.push('/pantry')}
            />
          </View>
        )}

        {/* Scan CTA */}
        <TouchableOpacity
          style={styles.scanCTA}
          onPress={() => router.push('/scan')}
          accessibilityRole="button"
          accessibilityLabel="Scan a receipt to add items to your pantry"
        >
          <Text style={styles.scanIcon}>📷</Text>
          <View style={styles.scanTextWrap}>
            <Text style={styles.scanTitle}>Scan a Receipt</Text>
            <Text style={styles.scanSub}>
              Capture items &amp; track spending
            </Text>
          </View>
          <Text style={styles.scanArrow}>›</Text>
        </TouchableOpacity>

        {/* Demo data */}
        <TouchableOpacity
          style={styles.demoBtn}
          onPress={handleLoadDemo}
          disabled={loadingDemo}
          accessibilityRole="button"
          accessibilityLabel="Load demo data"
        >
          {loadingDemo ? (
            <ActivityIndicator color="#2E7D32" />
          ) : (
            <Text style={styles.demoBtnText}>✨ Load Demo Data</Text>
          )}
        </TouchableOpacity>

        {/* Suggested Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Meals</Text>
            <TouchableOpacity
              onPress={() => router.push('/recipes')}
              accessibilityRole="button"
              accessibilityLabel="See all recipe suggestions"
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {featuredRecipes.length === 0 ? (
            <View style={styles.emptyRecipes}>
              <Text style={styles.emptyText}>
                Add items to your pantry to get recipe suggestions.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/recipes')}
                style={styles.suggestBtn}
                accessibilityRole="button"
              >
                <Text style={styles.suggestBtnText}>Suggest Recipes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            featuredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  value,
  label,
  icon,
  accent = false,
  onPress,
}: {
  value: string;
  label: string;
  icon: string;
  accent?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.statCard, accent && styles.statCardAccent]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
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
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 22,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 88,
    justifyContent: 'center',
  },
  statCardAccent: {
    borderWidth: 1.5,
    borderColor: '#F57F17',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#212121',
  },
  statValueAccent: {
    color: '#F57F17',
  },
  statLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 2,
  },
  scanCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 72,
  },
  scanIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  scanTextWrap: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanSub: {
    fontSize: 13,
    color: '#C8E6C9',
    marginTop: 2,
  },
  scanArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  demoBtn: {
    marginHorizontal: 16,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    marginBottom: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  demoBtnText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  seeAll: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  emptyRecipes: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 12,
  },
  suggestBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  suggestBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
