import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [progress, setProgress] = useState<any>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [prog, analyses] = await Promise.all([api.getProgress(), api.getAnalyses()]);
      setProgress(prog);
      setRecentAnalyses(analyses.slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.center} testID="dashboard-loading">
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  const hasData = progress && progress.total_analyses > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        testID="dashboard-screen"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.brand.primary} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          {t.welcome}, {user?.name?.split(' ')[0]} 
        </Text>

        {!hasData ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="videocam-outline" size={48} color={theme.colors.brand.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t.no_analyses}</Text>
            <Text style={styles.emptyText}>{t.upload_first}</Text>
            <TouchableOpacity
              testID="dashboard-upload-btn"
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/upload')}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.text.inverse} />
              <Text style={styles.ctaText}>{t.pick_video}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard value={progress.total_analyses} label={t.total_analyses} />
              <StatCard value={progress.average_score} label={t.avg_score} />
              <StatCard value={progress.best_score} label={t.best_score} accent />
            </View>

            {progress.improvement !== 0 && (
              <View style={styles.improvementCard}>
                <Ionicons
                  name={progress.improvement > 0 ? 'arrow-up-circle' : 'arrow-down-circle'}
                  size={22}
                  color={progress.improvement > 0 ? theme.colors.status.success : theme.colors.status.error}
                />
                <Text style={[
                  styles.improvementText,
                  { color: progress.improvement > 0 ? theme.colors.status.success : theme.colors.status.error },
                ]}>
                  {progress.improvement > 0 ? '+' : ''}{progress.improvement} {t.points} {t.improvement}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>{t.recent_activity}</Text>
            {recentAnalyses.map((a) => (
              <TouchableOpacity
                key={a.id}
                testID={`dashboard-analysis-${a.id}`}
                style={styles.analysisCard}
                onPress={() => router.push(`/analysis/${a.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreText}>{a.overall_score}</Text>
                </View>
                <View style={styles.analysisInfo}>
                  <Text style={styles.analysisFile} numberOfLines={1}>{a.filename}</Text>
                  <Text style={styles.analysisDate}>
                    {new Date(a.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
      <Text style={styles.credit}>Desarrollado por Felipe</Text>
    </SafeAreaView>
  );
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent && { color: theme.colors.brand.primary }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.default },
  center: { flex: 1, backgroundColor: theme.colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  greeting: { fontSize: theme.font.xl, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 24 },
  emptyCard: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 32,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  emptyText: { fontSize: theme.font.sm, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 24 },
  ctaButton: {
    backgroundColor: theme.colors.brand.primary,
    height: 50,
    borderRadius: theme.radius.full,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: { color: theme.colors.text.inverse, fontWeight: '700', fontSize: theme.font.base },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: theme.font.xxl, fontWeight: '800', color: theme.colors.text.primary },
  statLabel: { fontSize: theme.font.xs, color: theme.colors.text.tertiary, marginTop: 4 },
  improvementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  improvementText: { fontSize: theme.font.sm, fontWeight: '600' },
  sectionTitle: { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 12 },
  analysisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: { fontSize: theme.font.base, fontWeight: '800', color: theme.colors.brand.primary },
  analysisInfo: { flex: 1, marginLeft: 12 },
  analysisFile: { fontSize: theme.font.sm, fontWeight: '600', color: theme.colors.text.primary },
  analysisDate: { fontSize: theme.font.xs, color: theme.colors.text.tertiary, marginTop: 2 },
  credit: { position: 'absolute', bottom: 8, left: 20, fontSize: 11, color: theme.colors.brand.primary, opacity: 0.6 },
});
