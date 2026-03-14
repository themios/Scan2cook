import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
const AUTH_API_URL = API_BASE_URL ? `${API_BASE_URL}/api/auth` : '';

export const AUTH_TOKEN_KEY = 'scan2cook_auth_token';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

async function requestAuth(action: string, payload?: Record<string, unknown>, token?: string) {
  if (!AUTH_API_URL) {
    throw new Error(
      'API base URL not configured. Set EXPO_PUBLIC_API_BASE_URL in your .env file.'
    );
  }

  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Auth API error ${response.status}: ${err}`);
  }

  return response.json();
}

async function setToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthUser> {
  const result = await requestAuth('register', input);
  const token = result?.data?.token as string;
  const user = result?.data?.user as AuthUser;
  if (!token || !user) throw new Error('Invalid register response');
  await setToken(token);
  return user;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const result = await requestAuth('login', input);
  const token = result?.data?.token as string;
  const user = result?.data?.user as AuthUser;
  if (!token || !user) throw new Error('Invalid login response');
  await setToken(token);
  return user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const result = await requestAuth('me', {}, token);
    return result?.data?.user as AuthUser;
  } catch {
    return null;
  }
}

export async function logoutUser() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}
