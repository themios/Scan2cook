import { PantryItem, Recipe } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
const API_URL = API_BASE_URL ? `${API_BASE_URL}/api/ai` : '';

// ── Receipt parsing ───────────────────────────────────────────────────────────

export interface ParsedReceipt {
  store: string;
  date: string;
  items: Array<{
    name: string;
    quantity: string;
    price: number;
    category: string;
  }>;
  total: number;
  tax: number;
}

export async function parseReceiptImage(
  base64Image: string
): Promise<ParsedReceipt> {
  if (!API_URL) {
    throw new Error(
      'API base URL not configured. Set EXPO_PUBLIC_API_BASE_URL in your .env file.'
    );
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'parseReceipt',
      payload: {
        base64Image,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Backend API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.data as ParsedReceipt;
}

// ── Recipe suggestions ────────────────────────────────────────────────────────

export async function suggestRecipes(
  pantryItems: PantryItem[]
): Promise<Recipe[]> {
  if (!API_URL) {
    throw new Error(
      'API base URL not configured. Set EXPO_PUBLIC_API_BASE_URL in your .env file.'
    );
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'suggestRecipes',
      payload: {
        pantryItems,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Backend API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.data as Recipe[];
}
