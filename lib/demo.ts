/**
 * Demo seed data so the app is usable without scanning a real receipt.
 */
import { PantryItem, Receipt, Recipe } from './types';

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const DEMO_PANTRY_ITEMS: PantryItem[] = [
  {
    id: 'demo-1',
    name: 'Chicken Breast',
    quantity: '2 lbs',
    category: 'Meat',
    estimatedExpiration: fmt(addDays(today, 2)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 8.99,
  },
  {
    id: 'demo-2',
    name: 'Broccoli',
    quantity: '1 head',
    category: 'Vegetables',
    estimatedExpiration: fmt(addDays(today, 5)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 2.49,
  },
  {
    id: 'demo-3',
    name: 'Brown Rice',
    quantity: '2 lbs',
    category: 'Grains',
    estimatedExpiration: fmt(addDays(today, 180)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 3.99,
  },
  {
    id: 'demo-4',
    name: 'Cheddar Cheese',
    quantity: '8 oz',
    category: 'Dairy',
    estimatedExpiration: fmt(addDays(today, 14)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 4.29,
  },
  {
    id: 'demo-5',
    name: 'Eggs',
    quantity: '12 count',
    category: 'Dairy',
    estimatedExpiration: fmt(addDays(today, 21)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 5.49,
  },
  {
    id: 'demo-6',
    name: 'Bananas',
    quantity: '1 bunch',
    category: 'Fruit',
    estimatedExpiration: fmt(addDays(today, 4)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 1.29,
  },
  {
    id: 'demo-7',
    name: 'Frozen Peas',
    quantity: '16 oz bag',
    category: 'Frozen',
    estimatedExpiration: fmt(addDays(today, 90)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 2.79,
  },
  {
    id: 'demo-8',
    name: 'Olive Oil',
    quantity: '500 ml',
    category: 'Other',
    estimatedExpiration: fmt(addDays(today, 365)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 7.99,
  },
  {
    id: 'demo-9',
    name: 'Greek Yogurt',
    quantity: '32 oz',
    category: 'Dairy',
    estimatedExpiration: fmt(addDays(today, 10)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 6.49,
  },
  {
    id: 'demo-10',
    name: 'Garlic',
    quantity: '1 bulb',
    category: 'Vegetables',
    estimatedExpiration: fmt(addDays(today, 30)),
    purchaseDate: fmt(today),
    store: 'Whole Foods',
    price: 0.89,
  },
];

export const DEMO_RECEIPT: Receipt = {
  id: 'demo-receipt-1',
  store: 'Whole Foods',
  date: fmt(today),
  total: 44.70,
  tax: 0.0,
  items: DEMO_PANTRY_ITEMS.map((p) => ({
    id: `ri-${p.id}`,
    name: p.name,
    rawName: p.name.toUpperCase(),
    quantity: p.quantity,
    price: p.price,
    category: p.category,
  })),
};

export const DEMO_RECIPES: Recipe[] = [
  {
    id: 'demo-recipe-1',
    name: 'Chicken & Broccoli Rice Bowl',
    ingredients: [
      '2 chicken breasts',
      '1 cup brown rice',
      '1 head broccoli, cut into florets',
      '2 tbsp olive oil',
      '3 cloves garlic, minced',
      'Salt and pepper to taste',
    ],
    instructions: [
      'Cook brown rice according to package directions.',
      'Season chicken breasts with salt, pepper, and half the garlic.',
      'Heat 1 tbsp olive oil in a skillet over medium-high heat.',
      'Cook chicken 6-7 minutes per side until cooked through. Slice.',
      'Steam or sauté broccoli with remaining olive oil and garlic until tender-crisp.',
      'Serve chicken and broccoli over rice.',
    ],
    nutrition: {
      calories: 520,
      protein: 45,
      fat: 14,
      carbs: 52,
      fiber: 5,
    },
  },
  {
    id: 'demo-recipe-2',
    name: 'Cheesy Scrambled Eggs',
    ingredients: [
      '3 eggs',
      '2 tbsp cheddar cheese, shredded',
      '1 tbsp olive oil',
      'Salt and pepper to taste',
    ],
    instructions: [
      'Crack eggs into a bowl, season with salt and pepper, and whisk well.',
      'Heat olive oil in a non-stick pan over medium-low heat.',
      'Pour in eggs and gently stir with a spatula as they cook.',
      'When almost set, fold in cheddar cheese.',
      'Remove from heat while still slightly glossy. Serve immediately.',
    ],
    nutrition: {
      calories: 310,
      protein: 22,
      fat: 24,
      carbs: 2,
      fiber: 0,
    },
  },
  {
    id: 'demo-recipe-3',
    name: 'Banana Yogurt Parfait',
    ingredients: [
      '1 cup Greek yogurt',
      '1 banana, sliced',
      '1 tsp honey (optional)',
    ],
    instructions: [
      'Spoon Greek yogurt into a bowl or glass.',
      'Top with sliced banana.',
      'Drizzle with honey if desired.',
      'Serve immediately.',
    ],
    nutrition: {
      calories: 220,
      protein: 17,
      fat: 3,
      carbs: 32,
      fiber: 2,
    },
  },
];
