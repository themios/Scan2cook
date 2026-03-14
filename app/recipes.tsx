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
import { getPantry } from '../lib/storage';
import { suggestRecipes } from '../lib/claude';
import { PantryItem, Recipe } from '../lib/types';
import { DEMO_RECIPES } from '../lib/demo';
import RecipeCard from '../components/RecipeCard';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPantry();
    }, [])
  );

  async function loadPantry() {
    setInitialLoading(true);
    const items = await getPantry();
    setPantryItems(items);
    setInitialLoading(false);
  }

  async function handleSuggest() {
    if (pantryItems.length === 0) {
      Alert.alert(
        'Empty Pantry',
        'Add items to your pantry first by scanning a receipt or adding manually.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await suggestRecipes(pantryItems);
      setRecipes(result);
      setHasLoaded(true);
    } catch (err: any) {
      setError(
        err.message?.includes('API base URL')
          ? err.message
          : 'Could not get recipe suggestions. Check your API setup and try again.'
      );
      setHasLoaded(false);
    } finally {
      setLoading(false);
    }
  }

  function handleShowDemo() {
    setRecipes(DEMO_RECIPES);
    setHasLoaded(true);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.title}>Recipes</Text>
        {pantryItems.length > 0 && (
          <Text style={styles.subtitle}>
            Based on {pantryItems.length} pantry items
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {initialLoading ? (
          <ActivityIndicator
            color="#2E7D32"
            style={{ marginTop: 40 }}
            accessibilityLabel="Loading pantry"
          />
        ) : (
          <>
            {/* Suggest button */}
            <TouchableOpacity
              style={[
                styles.suggestBtn,
                loading && styles.suggestBtnDisabled,
              ]}
              onPress={handleSuggest}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Suggest recipes from my pantry"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.suggestBtnIcon}>👨‍🍳</Text>
                  <Text style={styles.suggestBtnText}>
                    Suggest Recipes from Pantry
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {loading && (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>
                  AI is thinking up recipes...
                </Text>
                <Text style={styles.loadingSubText}>
                  This usually takes 5–10 seconds
                </Text>
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Demo fallback */}
            {!hasLoaded && !loading && (
              <View style={styles.demoCard}>
                <Text style={styles.demoCardText}>
                  API not connected yet? Try demo recipes.
                </Text>
                <TouchableOpacity
                  onPress={handleShowDemo}
                  style={styles.demoCardBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Show demo recipes"
                >
                  <Text style={styles.demoCardBtnText}>Show Demo Recipes</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Recipe list */}
            {recipes.length > 0 && (
              <View style={styles.recipeList}>
                <Text style={styles.recipeCount}>
                  {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}{' '}
                  found
                </Text>
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </View>
            )}

            {/* Pantry empty state */}
            {pantryItems.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>Pantry is empty</Text>
                <Text style={styles.emptyBody}>
                  Scan a receipt or add items to your pantry to get
                  personalized recipe suggestions.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212121',
  },
  subtitle: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  suggestBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    minHeight: 56,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestBtnDisabled: {
    opacity: 0.7,
  },
  suggestBtnIcon: {
    fontSize: 22,
  },
  suggestBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },
  loadingSubText: {
    fontSize: 13,
    color: '#66BB6A',
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#C62828',
    lineHeight: 20,
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  demoCardText: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 10,
    textAlign: 'center',
  },
  demoCardBtn: {
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  demoCardBtnText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  recipeList: {
    marginTop: 4,
  },
  recipeCount: {
    fontSize: 13,
    color: '#9E9E9E',
    marginBottom: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
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
    lineHeight: 21,
  },
});
