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
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getPantry } from '../lib/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  extractRecipeDataFromUpload,
  suggestRecipes,
  suggestRecipesFromPhoto,
} from '../lib/claude';
import { PantryItem, Recipe } from '../lib/types';
import {
  listRecipeUploadsFromCloud,
  RecipeUploadMeta,
  saveRecipeUploadToCloud,
} from '../lib/cloud';
import { DEMO_RECIPES } from '../lib/demo';
import RecipeCard from '../components/RecipeCard';

const CUISINE_OPTIONS = [
  'Any',
  'Greek',
  'Italian',
  'American',
  'Indian',
  'Thai',
  'Chinese',
  'Mexican',
  'Japanese',
  'Mediterranean',
] as const;

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [selectedCuisine, setSelectedCuisine] =
    useState<(typeof CUISINE_OPTIONS)[number]>('Any');
  const [mainIngredientsInput, setMainIngredientsInput] = useState('');
  const [recipeCount, setRecipeCount] = useState(3);
  const [servings, setServings] = useState(2);
  const [uploads, setUploads] = useState<RecipeUploadMeta[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
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
    try {
      const [items, savedUploads] = await Promise.all([
        getPantry(),
        listRecipeUploadsFromCloud().catch(() => []),
      ]);
      setPantryItems(items);
      setUploads(savedUploads);
    } finally {
      setInitialLoading(false);
    }
  }

  async function handleSuggest() {
    const mainIngredients = getMainIngredients();

    if (pantryItems.length === 0 && mainIngredients.length === 0) {
      Alert.alert(
        'Need Ingredients',
        'Add pantry items or type main ingredients to get recipe suggestions.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await suggestRecipes(pantryItems, buildRecipePreferences(mainIngredients));
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

  function getMainIngredients() {
    return mainIngredientsInput
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  function buildRecipePreferences(mainIngredients = getMainIngredients()) {
    return {
      cuisine: selectedCuisine,
      mainIngredients,
      recipeCount,
      servings,
    };
  }

  async function handleSuggestFromPhoto(base64Image: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await suggestRecipesFromPhoto(
        base64Image,
        pantryItems,
        buildRecipePreferences()
      );
      setRecipes(result);
      setHasLoaded(true);
    } catch (err: any) {
      setError(
        err.message?.includes('API base URL')
          ? err.message
          : 'Could not get recipe suggestions from photo. Check your API setup and try again.'
      );
      setHasLoaded(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleTakePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Needed',
          'Allow camera access to take a photo of your ingredients.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const base64 = result.assets[0].base64;
      if (!base64) {
        Alert.alert('Photo Error', 'Could not read image data from camera.');
        return;
      }

      await handleSuggestFromPhoto(base64);
    } catch {
      Alert.alert(
        'Camera Not Available',
        'Use "Choose Food Photo" to upload an image from your device.'
      );
    }
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const base64 = result.assets[0].base64;
    if (!base64) {
      Alert.alert('Image Error', 'Could not read image data from selected file.');
      return;
    }

    await handleSuggestFromPhoto(base64);
  }

  async function handleUploadRecipeFile() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
        base64: true,
      });

      if (picked.canceled || !picked.assets?.length) return;
      const file = picked.assets[0];
      const base64Data = file.base64;

      if (!base64Data) {
        Alert.alert('Upload Failed', 'Could not read file content.');
        return;
      }

      setUploadingFile(true);
      const ocrData = await extractRecipeDataFromUpload({
        mimeType: file.mimeType || 'application/octet-stream',
        base64Data,
      });

      await saveRecipeUploadToCloud({
        fileName: file.name || 'recipe-file',
        mimeType: file.mimeType || 'application/octet-stream',
        ocrData,
      });

      const latestUploads = await listRecipeUploadsFromCloud();
      setUploads(latestUploads);
      Alert.alert('Saved', 'Recipe OCR data saved to cloud database.');
    } catch (err: any) {
      const message =
        err.message?.includes('Please sign in')
          ? 'Please sign in from the Account tab first.'
          : err.message || 'Could not upload file.';
      Alert.alert('Upload Failed', message);
    } finally {
      setUploadingFile(false);
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
        <Text style={styles.systemTag}>Food intelligence from receipts + photos</Text>
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
            <View style={styles.prefCard}>
              <Text style={styles.prefLabel}>Cuisine</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cuisineRow}
              >
                {CUISINE_OPTIONS.map((cuisine) => {
                  const selected = selectedCuisine === cuisine;
                  return (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.cuisineChip,
                        selected && styles.cuisineChipSelected,
                      ]}
                      onPress={() => setSelectedCuisine(cuisine)}
                      accessibilityRole="button"
                      accessibilityLabel={`Cuisine ${cuisine}`}
                    >
                      <Text
                        style={[
                          styles.cuisineChipText,
                          selected && styles.cuisineChipTextSelected,
                        ]}
                      >
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.prefLabel}>Main Ingredients (Optional)</Text>
              <TextInput
                style={styles.ingredientsInput}
                value={mainIngredientsInput}
                onChangeText={setMainIngredientsInput}
                placeholder="e.g. chicken, rice, tomato"
                placeholderTextColor="#9E9E9E"
                autoCapitalize="none"
                accessibilityLabel="Main ingredients input"
              />
              <Text style={styles.prefHint}>
                Separate ingredients with commas.
              </Text>

              <View style={styles.countsRow}>
                <View style={styles.countCard}>
                  <Text style={styles.countLabel}>Recipes</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setRecipeCount((v) => Math.max(1, v - 1))}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease recipe count"
                    >
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.countValue}>{recipeCount}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setRecipeCount((v) => Math.min(10, v + 1))}
                      accessibilityRole="button"
                      accessibilityLabel="Increase recipe count"
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.countCard}>
                  <Text style={styles.countLabel}>Servings</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setServings((v) => Math.max(1, v - 1))}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease servings"
                    >
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.countValue}>{servings}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setServings((v) => Math.min(20, v + 1))}
                      accessibilityRole="button"
                      accessibilityLabel="Increase servings"
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

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

            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={handleTakePhoto}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Take photo of ingredients"
              >
                <Text style={styles.photoActionText}>Take Item Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={handlePickPhoto}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Choose ingredients photo"
              >
                <Text style={styles.photoActionText}>Choose Food Photo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.uploadRecipeBtn, uploadingFile && styles.suggestBtnDisabled]}
              onPress={handleUploadRecipeFile}
              disabled={uploadingFile}
              accessibilityRole="button"
              accessibilityLabel="Upload recipe screenshot, image, or PDF"
            >
              {uploadingFile ? (
                <ActivityIndicator color="#2E7D32" />
              ) : (
                <Text style={styles.uploadRecipeBtnText}>
                  Upload Recipe Screenshot / Image / PDF
                </Text>
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

            {uploads.length > 0 && (
              <View style={styles.uploadsCard}>
                <Text style={styles.uploadsTitle}>Saved Recipe Files</Text>
                {uploads.slice(0, 8).map((upload) => (
                  <View key={upload.id} style={styles.uploadRow}>
                    <Text style={styles.uploadFileName} numberOfLines={1}>
                      {upload.ocrTitle || upload.fileName}
                    </Text>
                    <Text style={styles.uploadMeta}>
                      {new Date(upload.uploadedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Pantry empty state */}
            {pantryItems.length === 0 && mainIngredientsInput.trim().length === 0 && (
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
  systemTag: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 4,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  prefCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  prefLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 8,
  },
  cuisineRow: {
    paddingBottom: 10,
    gap: 8,
  },
  cuisineChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cuisineChipSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  cuisineChipText: {
    fontSize: 12,
    color: '#616161',
    fontWeight: '600',
  },
  cuisineChipTextSelected: {
    color: '#FFFFFF',
  },
  ingredientsInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212121',
    minHeight: 44,
  },
  prefHint: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 6,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  countCard: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  countLabel: {
    fontSize: 12,
    color: '#616161',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  countValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
    minWidth: 26,
    textAlign: 'center',
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
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -4,
    marginBottom: 16,
  },
  photoActionBtn: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  photoActionText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '700',
    textAlign: 'center',
  },
  uploadRecipeBtn: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  uploadRecipeBtnText: {
    color: '#424242',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
  uploadsCard: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
  },
  uploadsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  uploadFileName: {
    flex: 1,
    fontSize: 13,
    color: '#424242',
    marginRight: 8,
  },
  uploadMeta: {
    fontSize: 12,
    color: '#9E9E9E',
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
