import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { PantryItem as PantryItemType, CATEGORY_ICONS } from '../lib/types';

interface Props {
  item: PantryItemType;
  onDelete: (id: string) => void;
  onEdit: (item: PantryItemType) => void;
}

function getExpiryColor(isoDate: string): string {
  const now = new Date();
  const exp = new Date(isoDate);
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return '#B71C1C'; // expired
  if (diffDays <= 3) return '#C62828'; // red
  if (diffDays <= 7) return '#F57F17'; // yellow
  return '#2E7D32'; // green
}

function formatExpiry(isoDate: string): string {
  const now = new Date();
  const exp = new Date(isoDate);
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
  if (diffDays === 0) return 'Expires today';
  if (diffDays === 1) return 'Expires tomorrow';
  return `Expires in ${diffDays}d`;
}

export default function PantryItem({ item, onDelete, onEdit }: Props) {
  const expiryColor = getExpiryColor(item.estimatedExpiration);
  const icon = CATEGORY_ICONS[item.category] ?? '📦';

  function handleLongPress() {
    Alert.alert(item.name, 'What would you like to do?', [
      { text: 'Edit', onPress: () => onEdit(item) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Item',
            `Remove ${item.name} from your pantry?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => onDelete(item.id),
              },
            ]
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onEdit(item)}
      onLongPress={handleLongPress}
      accessibilityLabel={`${item.name}, ${item.quantity}, ${formatExpiry(item.estimatedExpiration)}`}
      accessibilityRole="button"
      accessibilityHint="Tap to edit, long press for more options"
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.quantity}>{item.quantity}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.expiry, { color: expiryColor }]}>
          {formatExpiry(item.estimatedExpiration)}
        </Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    minHeight: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  quantity: {
    fontSize: 13,
    color: '#757575',
  },
  right: {
    alignItems: 'flex-end',
  },
  expiry: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    color: '#757575',
  },
});
