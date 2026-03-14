import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { ReceiptItem, ALL_CATEGORIES, CATEGORY_ICONS } from '../lib/types';

interface Props {
  store: string;
  date: string;
  items: ReceiptItem[];
  total: number;
  tax: number;
  onConfirm: (items: ReceiptItem[], store: string) => void;
  onCancel: () => void;
}

export default function ReceiptReview({
  store: initialStore,
  date,
  items: initialItems,
  total,
  tax,
  onConfirm,
  onCancel,
}: Props) {
  const [items, setItems] = useState<ReceiptItem[]>(initialItems);
  const [store, setStore] = useState(initialStore);

  function updateItem(id: string, changes: Partial<ReceiptItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleConfirm() {
    if (items.length === 0) {
      Alert.alert('No Items', 'Add at least one item before confirming.');
      return;
    }
    onConfirm(items, store);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Review Receipt</Text>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelBtn}
          accessibilityLabel="Cancel receipt review"
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryField}>
          <Text style={styles.summaryLabel}>Store</Text>
          <TextInput
            style={styles.storeInput}
            value={store}
            onChangeText={setStore}
            placeholder="Store name"
            accessibilityLabel="Store name"
          />
        </View>
        <View style={styles.summaryField}>
          <Text style={styles.summaryLabel}>Date</Text>
          <Text style={styles.summaryValue}>{date}</Text>
        </View>
        <View style={styles.summaryField}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.itemsHeader}>
        {items.length} item{items.length !== 1 ? 's' : ''} — tap to edit
      </Text>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item) => (
          <ReviewItem
            key={item.id}
            item={item}
            onChange={(changes) => updateItem(item.id, changes)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          accessibilityRole="button"
          accessibilityLabel="Add all items to pantry"
        >
          <Text style={styles.confirmText}>Add to Pantry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReviewItem({
  item,
  onChange,
  onRemove,
}: {
  item: ReceiptItem;
  onChange: (c: Partial<ReceiptItem>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <View style={styles.reviewItem}>
      <TouchableOpacity
        style={styles.reviewItemHeader}
        onPress={() => setEditing((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, tap to ${editing ? 'collapse' : 'edit'}`}
      >
        <Text style={styles.itemIcon}>
          {CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] ?? '📦'}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemSub}>
            {item.quantity} · ${item.price.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeBtn}
          accessibilityLabel={`Remove ${item.name}`}
          accessibilityRole="button"
        >
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {editing && (
        <View style={styles.editFields}>
          <EditField
            label="Name"
            value={item.name}
            onChangeText={(v) => onChange({ name: v })}
          />
          <EditField
            label="Quantity"
            value={item.quantity}
            onChangeText={(v) => onChange({ quantity: v })}
          />
          <EditField
            label="Price"
            value={String(item.price)}
            onChangeText={(v) => onChange({ price: parseFloat(v) || 0 })}
            keyboardType="decimal-pad"
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
                onPress={() => onChange({ category: cat })}
                accessibilityLabel={`Category: ${cat}`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.catChipText,
                    item.category === cat && styles.catChipTextSelected,
                  ]}
                >
                  {CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]} {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function EditField({
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
    <View style={styles.editFieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212121',
  },
  cancelBtn: {
    padding: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#C62828',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  summaryField: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  storeInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD',
  },
  itemsHeader: {
    fontSize: 13,
    color: '#757575',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reviewItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 56,
  },
  itemIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  itemSub: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  editFields: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  editFieldWrapper: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: '#212121',
    minHeight: 44,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 32,
    justifyContent: 'center',
  },
  catChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  catChipText: {
    fontSize: 12,
    color: '#757575',
  },
  catChipTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  confirmBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
