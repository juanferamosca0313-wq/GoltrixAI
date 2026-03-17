import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(t.error, e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Ionicons name="football-outline" size={56} color={theme.colors.brand.primary} />
            <Text style={styles.title}>Strike<Text style={styles.accent}>AI</Text></Text>
            <Text style={styles.subtitle}>{t.login}</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              testID="login-email-input"
              style={styles.input}
              placeholder={t.email}
              placeholderTextColor={theme.colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              testID="login-password-input"
              style={styles.input}
              placeholder={t.password}
              placeholderTextColor={theme.colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              testID="login-submit-button"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.text.inverse} />
              ) : (
                <Text style={styles.buttonText}>{t.login}</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID="login-register-link"
            onPress={() => router.push('/(auth)/register')}
            style={styles.linkContainer}
          >
            <Text style={styles.link}>
              {t.no_account}{' '}
              <Text style={styles.linkAccent}>{t.register}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.default },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 44, fontWeight: '900', color: theme.colors.text.primary, marginTop: 16 },
  accent: { color: theme.colors.brand.primary },
  subtitle: { fontSize: theme.font.lg, color: theme.colors.text.secondary, marginTop: 8 },
  form: { gap: 16 },
  input: {
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: theme.radius.md,
    height: 52,
    color: theme.colors.text.primary,
    paddingHorizontal: 16,
    fontSize: theme.font.base,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  button: {
    backgroundColor: theme.colors.brand.primary,
    height: 56,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: theme.colors.text.inverse, fontWeight: '700', fontSize: theme.font.base },
  linkContainer: { marginTop: 32, alignItems: 'center' },
  link: { color: theme.colors.text.secondary, fontSize: theme.font.sm },
  linkAccent: { color: theme.colors.brand.primary, fontWeight: '600' },
});
