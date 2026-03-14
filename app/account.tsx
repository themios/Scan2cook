import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  AuthUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../lib/auth';

export default function AccountScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  async function loadUser() {
    setChecking(true);
    try {
      const current = await getCurrentUser();
      setUser(current);
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const nextUser =
        mode === 'register'
          ? await registerUser({ email, password, name })
          : await loginUser({ email, password });
      setUser(nextUser);
      setPassword('');
      Alert.alert('Success', mode === 'register' ? 'Account created.' : 'Signed in.');
    } catch (err: any) {
      Alert.alert('Auth failed', err.message || 'Could not complete request.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    setPassword('');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Sign in to keep your own cloud recipe files.</Text>

        {checking ? (
          <ActivityIndicator color="#2E7D32" style={{ marginTop: 20 }} />
        ) : user ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Signed In</Text>
            <Text style={styles.userText}>Name: {user.name || 'N/A'}</Text>
            <Text style={styles.userText}>Email: {user.email}</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
                onPress={() => setMode('register')}
              >
                <Text
                  style={[
                    styles.modeBtnText,
                    mode === 'register' && styles.modeBtnTextActive,
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'register' ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor="#9E9E9E"
              />
            ) : null}

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9E9E9E"
            />

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor="#9E9E9E"
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'register' ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212121',
  },
  subtitle: {
    marginTop: 6,
    color: '#757575',
    fontSize: 14,
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  userText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  modeBtnText: {
    color: '#616161',
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#2E7D32',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212121',
    minHeight: 44,
    marginBottom: 10,
  },
  submitBtn: {
    marginTop: 4,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D32F2F',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#D32F2F',
    fontWeight: '700',
  },
});
