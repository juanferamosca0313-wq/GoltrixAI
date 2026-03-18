import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(t.error, e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.iconGlow}>
              <Ionicons name="football-outline" size={50} color={theme.colors.brand.primary} />
            </View>
            <Text style={styles.title}>Goltrix<Text style={styles.accent}>AI</Text></Text>
            <Text style={styles.subtitle}>{t.register}</Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                testID="register-name-input"
                style={styles.input}
                placeholder={t.name}
                placeholderTextColor={theme.colors.text.tertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                testID="register-email-input"
                style={styles.input}
                placeholder={t.email}
                placeholderTextColor={theme.colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                testID="register-password-input"
                style={styles.input}
                placeholder={t.password}
                placeholderTextColor={theme.colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              testID="register-submit-button"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.text.inverse} />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>{t.register}</Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.colors.text.inverse} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity testID="register-login-link" onPress={() => router.back()} style={styles.linkContainer}>
              <Text style={styles.link}>
                {t.have_account}{' '}
                <Text style={styles.linkAccent}>{t.login}</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Text style={styles.credit}>Desarrollado por Felipe</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.default },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 40, fontWeight: '900', color: theme.colors.text.primary, marginTop: 16 },
  accent: { color: theme.colors.brand.primary },
  subtitle: { fontSize: theme.font.lg, color: theme.colors.text.secondary, marginTop: 6 },
  form: { gap: 14 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, height: 52, color: theme.colors.text.primary, paddingHorizontal: 12, fontSize: theme.font.base },
  button: {
    backgroundColor: theme.colors.brand.primary,
    height: 56,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: theme.colors.text.inverse, fontWeight: '700', fontSize: theme.font.base },
  linkContainer: { marginTop: 32, alignItems: 'center' },
  link: { color: theme.colors.text.secondary, fontSize: theme.font.sm },
  linkAccent: { color: theme.colors.brand.primary, fontWeight: '600' },
  credit: { position: 'absolute', bottom: 16, left: 20, fontSize: 11, color: theme.colors.brand.primary, opacity: 0.6 },
});
