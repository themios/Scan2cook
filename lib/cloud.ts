import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken } from './auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
const CLOUD_API_URL = API_BASE_URL ? `${API_BASE_URL}/api/cloud` : '';
const DEVICE_ID_KEY = 'scan2cook_device_id';

export interface RecipeUploadMeta {
  id: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  ocrTitle: string;
  ocrData: {
    title: string;
    ingredients: string[];
    instructions: string[];
    notes: string;
  };
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

async function requestCloud(action: string, payload?: Record<string, unknown>) {
  if (!CLOUD_API_URL) {
    throw new Error(
      'API base URL not configured. Set EXPO_PUBLIC_API_BASE_URL in your .env file.'
    );
  }

  const deviceId = await getOrCreateDeviceId();
  const authToken = await getAuthToken();
  const response = await fetch(CLOUD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloud API error ${response.status}: ${err}`);
  }

  return response.json();
}

export async function saveRecipeUploadToCloud(input: {
  fileName: string;
  mimeType: string;
  ocrData: {
    title: string;
    ingredients: string[];
    instructions: string[];
    notes: string;
  };
}): Promise<RecipeUploadMeta> {
  const data = await requestCloud('saveRecipeUpload', input);
  return data.data as RecipeUploadMeta;
}

export async function listRecipeUploadsFromCloud(): Promise<RecipeUploadMeta[]> {
  const data = await requestCloud('listRecipeUploads');
  return data.data as RecipeUploadMeta[];
}
