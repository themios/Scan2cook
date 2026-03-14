import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Recipe } from '../lib/types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: Props) {
  const [expanded, setExpanded] = useState(false);

  function toggleExpand() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  }

  const { nutrition } = recipe;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={`${recipe.name}, ${expanded ? 'collapse' : 'expand'} recipe`}
      >
        <Text style={styles.title}>{recipe.name}</Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Nutrition row always visible */}
      <View style={styles.nutritionRow}>
        <NutritionPill label="Cal" value={nutrition.calories} unit="" />
        <NutritionPill label="Protein" value={nutrition.protein} unit="g" />
        <NutritionPill label="Fat" value={nutrition.fat} unit="g" />
        <NutritionPill label="Carbs" value={nutrition.carbs} unit="g" />
        <NutritionPill label="Fiber" value={nutrition.fiber} unit="g" />
      </View>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>Ingredients</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bodyText}>{ing}</Text>
            </View>
          ))}

          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
            Instructions
          </Text>
          {recipe.instructions.map((step, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.stepNum}>{i + 1}.</Text>
              <Text style={styles.bodyText}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function NutritionPill({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>
        {value}
        {unit}
      </Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  chevron: {
    fontSize: 12,
    color: '#757575',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 52,
  },
  pillValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  pillLabel: {
    fontSize: 10,
    color: '#757575',
    marginTop: 1,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bullet: {
    fontSize: 14,
    color: '#2E7D32',
    marginRight: 6,
    marginTop: 1,
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    marginRight: 6,
    minWidth: 18,
  },
  bodyText: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
    lineHeight: 20,
  },
});
