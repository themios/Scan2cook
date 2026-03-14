import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

const PILLARS = [
  {
    icon: '🥗',
    title: 'Food Intelligence',
    body: 'Turn receipts and food photos into ingredient-aware meal suggestions in seconds.',
  },
  {
    icon: '💪',
    title: 'Health Focus',
    body: 'See nutrition estimates and build recipes around your preferred cuisine and serving sizes.',
  },
  {
    icon: '💸',
    title: 'Budget Control',
    body: 'Track weekly grocery spending, reduce waste, and cook from what you already own.',
  },
];

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FBF2" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.badge}>Scan2cook</Text>
          <Text style={styles.heroTitle}>
            Your Food, Health, and Budget Intelligence Hub
          </Text>
          <Text style={styles.heroBody}>
            Scan receipts, upload food photos, and generate practical recipes
            personalized to your pantry, cuisine, and goals.
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/account')}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              <Text style={styles.primaryBtnText}>Create Free Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/recipes')}
              accessibilityRole="button"
              accessibilityLabel="Open recipe generator"
            >
              <Text style={styles.secondaryBtnText}>Try Recipe Generator</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardRow}>
          <MetricCard label="Receipt OCR" value="AI Powered" />
          <MetricCard label="Recipe Modes" value="Pantry + Photo" />
          <MetricCard label="Cloud Scope" value="Per User" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why People Use Scan2cook</Text>
          {PILLARS.map((pillar) => (
            <View key={pillar.title} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{pillar.icon}</Text>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{pillar.title}</Text>
                <Text style={styles.featureBody}>{pillar.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ready to cook smarter?</Text>
          <Text style={styles.ctaBody}>
            Sign up, upload your first receipt, and let the app build meals from
            what you already bought.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/account')}
            accessibilityRole="button"
            accessibilityLabel="Sign up now"
          >
            <Text style={styles.ctaBtnText}>Sign Up Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4FBF2',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DDEED8',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    color: '#1B5E20',
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroBody: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#4E6A50',
  },
  heroActions: {
    marginTop: 16,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 12,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFF6',
  },
  secondaryBtnText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '800',
    textAlign: 'center',
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 12,
    marginBottom: 9,
    gap: 10,
  },
  featureIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263238',
  },
  featureBody: {
    marginTop: 4,
    fontSize: 13,
    color: '#607D63',
    lineHeight: 19,
  },
  ctaCard: {
    marginTop: 6,
    backgroundColor: '#1E4D2B',
    borderRadius: 14,
    padding: 16,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  ctaBody: {
    marginTop: 8,
    color: '#CDE7D1',
    fontSize: 14,
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: 12,
    backgroundColor: '#9CCC65',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    color: '#1B3B25',
    fontSize: 14,
    fontWeight: '800',
  },
});
