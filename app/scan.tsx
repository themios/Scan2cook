import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect, useRouter } from 'expo-router';
import { parseReceiptImage } from '../lib/claude';
import { addPantryItems, saveReceipt } from '../lib/storage';
import { PantryItem, ReceiptItem } from '../lib/types';
import ReceiptReview from '../components/ReceiptReview';

type ScreenState =
  | 'camera'
  | 'parsing'
  | 'review'
  | 'saving'
  | 'done';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function estimateExpiration(category: string): string {
  const days: Record<string, number> = {
    Fruit: 7,
    Vegetables: 7,
    Meat: 3,
    Dairy: 14,
    Grains: 180,
    Frozen: 90,
    Snacks: 60,
    Beverages: 30,
    Other: 30,
  };
  const d = new Date();
  d.setDate(d.getDate() + (days[category] ?? 14));
  return d.toISOString().split('T')[0];
}

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [parsedData, setParsedData] = useState<{
    store: string;
    date: string;
    items: ReceiptItem[];
    total: number;
    tax: number;
  } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Reset state when screen is focused
  useFocusEffect(
    useCallback(() => {
      return () => {
        // cleanup on blur - nothing needed
      };
    }, [])
  );

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady) return;

    try {
      setScreenState('parsing');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      // Resize to reduce payload size
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipulated.base64) {
        throw new Error('Failed to encode image');
      }

      const result = await parseReceiptImage(manipulated.base64);

      const receiptItems: ReceiptItem[] = result.items.map((item) => ({
        id: generateId(),
        name: item.name,
        rawName: item.name,
        quantity: item.quantity || '1',
        price: item.price,
        category: item.category,
      }));

      setParsedData({
        store: result.store || 'Unknown Store',
        date: result.date || new Date().toISOString().split('T')[0],
        items: receiptItems,
        total: result.total,
        tax: result.tax,
      });

      setScreenState('review');
    } catch (err: any) {
      setScreenState('camera');
      Alert.alert(
        'Parse Failed',
        err.message?.includes('API base URL')
          ? err.message
          : 'Could not parse the receipt. Make sure EXPO_PUBLIC_API_BASE_URL is set and try again with better lighting.',
        [{ text: 'OK' }]
      );
    }
  }

  async function handleConfirm(confirmedItems: ReceiptItem[], storeName: string) {
    if (!parsedData) return;
    setScreenState('saving');

    try {
      const today = new Date().toISOString().split('T')[0];

      const pantryItems: PantryItem[] = confirmedItems.map((item) => ({
        id: generateId(),
        name: item.name,
        quantity: item.quantity,
        category: item.category as PantryItem['category'],
        estimatedExpiration: estimateExpiration(item.category),
        purchaseDate: today,
        store: storeName,
        price: item.price,
      }));

      const receipt = {
        id: generateId(),
        store: storeName,
        date: parsedData.date,
        total: parsedData.total,
        tax: parsedData.tax,
        items: confirmedItems,
      };

      await Promise.all([
        addPantryItems(pantryItems),
        saveReceipt(receipt),
      ]);

      setScreenState('done');
    } catch (err: any) {
      setScreenState('review');
      Alert.alert('Save Failed', err.message || 'Could not save items.');
    }
  }

  function handleCancel() {
    setParsedData(null);
    setScreenState('camera');
  }

  function handleReset() {
    setParsedData(null);
    setScreenState('camera');
  }

  // ── Permission not yet determined ────────────────────────────────────────
  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color="#2E7D32" accessibilityLabel="Checking camera permissions" />
      </SafeAreaView>
    );
  }

  // ── No permission ─────────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionBody}>
          Receipt2Pantry uses your camera to scan grocery receipts and
          automatically add items to your pantry.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Grant camera permission"
        >
          <Text style={styles.permissionBtnText}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Go back to home"
        >
          <Text style={styles.skipBtnText}>Not Now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Done state ────────────────────────────────────────────────────────────
  if (screenState === 'done') {
    return (
      <SafeAreaView style={styles.doneScreen}>
        <Text style={styles.doneIcon}>✅</Text>
        <Text style={styles.doneTitle}>Added to Pantry!</Text>
        <Text style={styles.doneSub}>
          Items and receipt saved successfully.
        </Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.push('/pantry')}
          accessibilityRole="button"
          accessibilityLabel="Go to pantry"
        >
          <Text style={styles.doneBtnText}>View Pantry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.doneBtnSecondary}
          onPress={handleReset}
          accessibilityRole="button"
          accessibilityLabel="Scan another receipt"
        >
          <Text style={styles.doneBtnSecondaryText}>Scan Another</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Parsing overlay ───────────────────────────────────────────────────────
  if (screenState === 'parsing') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.parsingText}>Parsing receipt...</Text>
        <Text style={styles.parsingSubText}>
          AI is reading your receipt
        </Text>
      </SafeAreaView>
    );
  }

  // ── Saving overlay ────────────────────────────────────────────────────────
  if (screenState === 'saving') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.parsingText}>Saving items...</Text>
      </SafeAreaView>
    );
  }

  // ── Review state ──────────────────────────────────────────────────────────
  if (screenState === 'review' && parsedData) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ReceiptReview
          store={parsedData.store}
          date={parsedData.date}
          items={parsedData.items}
          total={parsedData.total}
          tax={parsedData.tax}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </SafeAreaView>
    );
  }

  // ── Camera view ───────────────────────────────────────────────────────────
  return (
    <View style={styles.cameraContainer}>
      <StatusBar barStyle="light-content" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      >
        {/* Overlay UI */}
        <View style={styles.cameraOverlay}>
          {/* Top bar */}
          <SafeAreaView>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.push('/')}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Scan Receipt</Text>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>

          {/* Guide frame */}
          <View style={styles.guideFrame}>
            <Text style={styles.guideText}>
              Position the receipt within the frame
            </Text>
            <View style={styles.receiptFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>

          {/* Bottom bar */}
          <View style={styles.bottomBar}>
            <Text style={styles.captureHint}>
              Make sure the receipt is well-lit and flat
            </Text>
            <TouchableOpacity
              style={[styles.captureBtn, !cameraReady && styles.captureBtnDisabled]}
              onPress={handleCapture}
              disabled={!cameraReady}
              accessibilityRole="button"
              accessibilityLabel="Take photo of receipt"
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  parsingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginTop: 16,
  },
  parsingSubText: {
    fontSize: 14,
    color: '#757575',
  },
  // Permission screen
  permissionScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F5F5F5',
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 15,
    color: '#757575',
  },
  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  guideFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  guideText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  receiptFrame: {
    width: '85%',
    aspectRatio: 0.6,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  captureHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  // Done screen
  doneScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F5F5F5',
  },
  doneIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  doneSub: {
    fontSize: 15,
    color: '#757575',
    marginBottom: 32,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtnSecondary: {
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  doneBtnSecondaryText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
});
