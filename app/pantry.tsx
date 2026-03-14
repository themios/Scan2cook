import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  getPantry,
  savePantry,
  deletePantryItem,
  updatePantryItem,
} from '../lib/storage';
import {
  PantryItem as PantryItemType,
  ALL_CATEGORIES,
  CATEGORY_ICONS,
  PantryCategory,
} from '../lib/types';
import PantryItemRow from '../components/PantryItem';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function PantryScreen() {
  const [items, setItems] = useState<PantryItemType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<string>
  >(new Set());
  const [editItem, setEditItem] = useState<PantryItemType | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPantry();
    }, [])
  );

  async function loadPantry() {
    setLoading(true);
    const data = await getPantry();
    setItems(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await deletePantryItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSave(item: PantryItemType) {
    await updatePantryItem(item);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? item : i))
    );
    setEditItem(null);
  }

  async function handleAdd(item: PantryItemType) {
    const all = await getPantry();
    all.push(item);
    await savePantry(all);
    setItems(all);
    setShowAdd(false);
  }

  function toggleCategory(cat: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  const filtered = search.trim()
    ? items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  // Group by category
  const grouped: Record<string, PantryItemType[]> = {};
  for (const item of filtered) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const sortedCategories = ALL_CATEGORIES.filter(
    (cat) => grouped[cat] && grouped[cat].length > 0
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.title}>Pantry</Text>
        <Text style={styles.subtitle}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAdd(true)}
          accessibilityRole="button"
          accessibilityLabel="Add pantry item manually"
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search pantry..."
          placeholderTextColor="#9E9E9E"
          accessibilityLabel="Search pantry items"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator
          color="#2E7D32"
          style={{ marginTop: 40 }}
          accessibilityLabel="Loading pantry"
        />
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🥫</Text>
          <Text style={styles.emptyTitle}>Pantry is empty</Text>
          <Text style={styles.emptyBody}>
            Scan a receipt or tap &ldquo;+ Add&rdquo; to add items.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyBody}>No items match &ldquo;{search}&rdquo;</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {sortedCategories.map((cat) => (
            <View key={cat}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(cat)}
                accessibilityRole="button"
                accessibilityLabel={`${cat} category, ${grouped[cat].length} items, ${collapsedCategories.has(cat) ? 'collapsed' : 'expanded'}`}
              >
                <Text style={styles.categoryIcon}>
                  {CATEGORY_ICONS[cat as PantryCategory]}
                </Text>
                <Text style={styles.categoryName}>{cat}</Text>
                <Text style={styles.categoryCount}>
                  {grouped[cat].length}
                </Text>
                <Text style={styles.categoryChevron}>
                  {collapsedCategories.has(cat) ? '▶' : '▼'}
                </Text>
              </TouchableOpacity>

              {!collapsedCategories.has(cat) &&
                grouped[cat].map((item) => (
                  <PantryItemRow
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onEdit={setEditItem}
                  />
                ))}
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Edit modal */}
      {editItem && (
        <ItemEditModal
          item={editItem}
          onSave={handleSave}
          onCancel={() => setEditItem(null)}
        />
      )}

      {/* Add modal */}
      {showAdd && (
        <ItemEditModal
          item={{
            id: generateId(),
            name: '',
            quantity: '1',
            category: 'Other',
            estimatedExpiration: (() => {
              const d = new Date();
              d.setDate(d.getDate() + 14);
              return d.toISOString().split('T')[0];
            })(),
            purchaseDate: new Date().toISOString().split('T')[0],
            store: '',
            price: 0,
          }}
          isNew
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </SafeAreaView>
  );
}

function ItemEditModal({
  item: initialItem,
  isNew = false,
  onSave,
  onCancel,
}: {
  item: PantryItemType;
  isNew?: boolean;
  onSave: (item: PantryItemType) => void;
  onCancel: () => void;
}) {
  const [item, setItem] = useState<PantryItemType>(initialItem);

  function field(key: keyof PantryItemType, value: string | number) {
    setItem((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!item.name.trim()) {
      Alert.alert('Required', 'Please enter an item name.');
      return;
    }
    onSave(item);
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.modal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.modalCancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isNew ? 'Add Item' : 'Edit Item'}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.modalSaveBtn}
              accessibilityRole="button"
              accessibilityLabel="Save item"
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <ModalField
              label="Name *"
              value={item.name}
              onChangeText={(v) => field('name', v)}
            />
            <ModalField
              label="Quantity"
              value={item.quantity}
              onChangeText={(v) => field('quantity', v)}
            />
            <ModalField
              label="Price"
              value={String(item.price)}
              onChangeText={(v) => field('price', parseFloat(v) || 0)}
              keyboardType="decimal-pad"
            />
            <ModalField
              label="Store"
              value={item.store}
              onChangeText={(v) => field('store', v)}
            />
            <ModalField
              label="Expiry (YYYY-MM-DD)"
              value={item.estimatedExpiration}
              onChangeText={(v) => field('estimatedExpiration', v)}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {ALL_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    item.category === cat && styles.catChipSelected,
                  ]}
                  onPress={() => field('category', cat)}
                  accessibilityRole="button"
                  accessibilityLabel={`Category: ${cat}`}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      item.category === cat && styles.catChipTextSelected,
                    ]}
                  >
                    {CATEGORY_ICONS[cat as PantryCategory]} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function ModalField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={styles.modalFieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.modalFieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212121',
  },
  subtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    marginLeft: 8,
    flex: 1,
    marginTop: 4,
  },
  addBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#424242',
    flex: 1,
  },
  categoryCount: {
    fontSize: 13,
    color: '#9E9E9E',
    marginRight: 6,
  },
  categoryChevron: {
    fontSize: 11,
    color: '#BDBDBD',
  },
  // Modal
  modal: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
  },
  modalCancelBtn: {
    minHeight: 44,
    minWidth: 64,
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#C62828',
  },
  modalSaveBtn: {
    minHeight: 44,
    minWidth: 64,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
  modalFieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalFieldInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#212121',
    minHeight: 46,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 36,
    justifyContent: 'center',
  },
  catChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  catChipText: {
    fontSize: 13,
    color: '#757575',
  },
  catChipTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});
