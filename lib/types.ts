export interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  category: 'Fruit' | 'Vegetables' | 'Meat' | 'Dairy' | 'Grains' | 'Frozen' | 'Snacks' | 'Beverages' | 'Other';
  estimatedExpiration: string; // ISO date
  purchaseDate: string;
  store: string;
  price: number;
}

export interface Receipt {
  id: string;
  store: string;
  date: string;
  total: number;
  tax: number;
  items: ReceiptItem[];
  imageUri?: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  rawName: string;
  quantity: string;
  price: number;
  category: string;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine?: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
}

export type PantryCategory =
  | 'Fruit'
  | 'Vegetables'
  | 'Meat'
  | 'Dairy'
  | 'Grains'
  | 'Frozen'
  | 'Snacks'
  | 'Beverages'
  | 'Other';

export const CATEGORY_ICONS: Record<PantryCategory, string> = {
  Fruit: '🍎',
  Vegetables: '🥦',
  Meat: '🍗',
  Dairy: '🧀',
  Grains: '🌾',
  Frozen: '❄️',
  Snacks: '🍿',
  Beverages: '🥤',
  Other: '📦',
};

export const ALL_CATEGORIES: PantryCategory[] = [
  'Fruit',
  'Vegetables',
  'Meat',
  'Dairy',
  'Grains',
  'Frozen',
  'Snacks',
  'Beverages',
  'Other',
];
