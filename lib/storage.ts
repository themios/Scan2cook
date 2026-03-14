import AsyncStorage from '@react-native-async-storage/async-storage';
import { PantryItem, Receipt } from './types';

const KEYS = {
  PANTRY: 'pantry_items',
  RECEIPTS: 'receipts',
};

// ── Pantry ──────────────────────────────────────────────────────────────────

export async function getPantry(): Promise<PantryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PANTRY);
    if (!raw) return [];
    return JSON.parse(raw) as PantryItem[];
  } catch {
    return [];
  }
}

export async function savePantry(items: PantryItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PANTRY, JSON.stringify(items));
}

export async function addPantryItems(newItems: PantryItem[]): Promise<void> {
  const existing = await getPantry();

  // Merge: if item with same name already exists, update quantity instead of duplicating
  const merged = [...existing];
  for (const item of newItems) {
    const idx = merged.findIndex(
      (e) => e.name.toLowerCase() === item.name.toLowerCase()
    );
    if (idx >= 0) {
      merged[idx] = item; // overwrite with fresher purchase
    } else {
      merged.push(item);
    }
  }

  await savePantry(merged);
}

export async function updatePantryItem(updated: PantryItem): Promise<void> {
  const items = await getPantry();
  const idx = items.findIndex((i) => i.id === updated.id);
  if (idx >= 0) {
    items[idx] = updated;
    await savePantry(items);
  }
}

export async function deletePantryItem(id: string): Promise<void> {
  const items = await getPantry();
  await savePantry(items.filter((i) => i.id !== id));
}

// ── Receipts ─────────────────────────────────────────────────────────────────

export async function getReceipts(): Promise<Receipt[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.RECEIPTS);
    if (!raw) return [];
    return JSON.parse(raw) as Receipt[];
  } catch {
    return [];
  }
}

export async function saveReceipt(receipt: Receipt): Promise<void> {
  const existing = await getReceipts();
  // Avoid duplicates by id
  const filtered = existing.filter((r) => r.id !== receipt.id);
  await AsyncStorage.setItem(
    KEYS.RECEIPTS,
    JSON.stringify([receipt, ...filtered])
  );
}

export async function deleteReceipt(id: string): Promise<void> {
  const receipts = await getReceipts();
  await AsyncStorage.setItem(
    KEYS.RECEIPTS,
    JSON.stringify(receipts.filter((r) => r.id !== id))
  );
}

// ── Clear all (dev/demo reset) ────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.PANTRY, KEYS.RECEIPTS]);
}
