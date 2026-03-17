import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();

  async function handleLanguageChange(newLang: 'en' | 'es') {
    setLang(newLang);
    try {
      await api.updateLanguage(newLang);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} testID="profile-screen">
        <Text style={styles.title}>{t.profile}</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={theme.colors.brand.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.created_at && (
              <Text style={styles.memberSince}>
                {t.member_since} {new Date(user.created_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.language}</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              testID="profile-lang-es"
              style={[styles.langBtn, lang === 'es' && styles.langBtnActive]}
              onPress={() => handleLanguageChange('es')}
              activeOpacity={0.7}
            >
              <Text style={[styles.langText, lang === 'es' && styles.langTextActive]}>
                {t.spanish}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="profile-lang-en"
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
              onPress={() => handleLanguageChange('en')}
              activeOpacity={0.7}
            >
              <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>
                {t.english}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          testID="profile-logout-button"
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.status.error} />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.default },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: theme.font.xl, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 24 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text.primary },
  userEmail: { fontSize: theme.font.sm, color: theme.colors.text.secondary, marginTop: 2 },
  memberSince: { fontSize: theme.font.xs, color: theme.colors.text.tertiary, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 12 },
  langRow: { flexDirection: 'row', gap: 12 },
  langBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: theme.colors.brand.primaryDim,
    borderColor: theme.colors.brand.primary,
  },
  langText: { fontSize: theme.font.sm, color: theme.colors.text.secondary, fontWeight: '600' },
  langTextActive: { color: theme.colors.brand.primary },
  spacer: { flex: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.secondary,
    borderWidth: 1,
    borderColor: theme.colors.status.error + '40',
    marginBottom: 32,
  },
  logoutText: { fontSize: theme.font.base, color: theme.colors.status.error, fontWeight: '600' },
});
