import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const TECHNIQUE_KEYS = [
  { key: 'body_position', label: 'body_position' },
  { key: 'foot_placement', label: 'foot_placement' },
  { key: 'follow_through', label: 'follow_through' },
  { key: 'approach_angle', label: 'approach_angle' },
  { key: 'power_generation', label: 'power_generation' },
] as const;

export default function Progress() {
  const { t } = useLanguage();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getProgress();
      setProgress(data);
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  if (!progress || progress.total_analyses === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{t.progress}</Text>
        <View style={styles.emptyWrap}>
          <Ionicons name="bar-chart-outline" size={48} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyText}>{t.start_analyzing}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        testID="progress-screen"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.brand.primary} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t.progress}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.total_analyses}</Text>
            <Text style={styles.statLabel}>{t.total_analyses}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.average_score}</Text>
            <Text style={styles.statLabel}>{t.avg_score}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.brand.primary }]}>
              {progress.best_score}
            </Text>
            <Text style={styles.statLabel}>{t.best_score}</Text>
          </View>
        </View>

        {progress.improvement !== 0 && (
          <View style={styles.improvementBanner}>
            <Ionicons
              name={progress.improvement > 0 ? 'trending-up' : 'trending-down'}
              size={24}
              color={progress.improvement > 0 ? theme.colors.status.success : theme.colors.status.error}
            />
            <Text style={[
              styles.improvementText,
              { color: progress.improvement > 0 ? theme.colors.status.success : theme.colors.status.error },
            ]}>
              {progress.improvement > 0 ? '+' : ''}{progress.improvement} {t.points}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t.score_history}</Text>
        <View style={styles.chartCard}>
          <View style={styles.barChart}>
            {progress.recent_scores.map((item: any, idx: number) => {
              const maxHeight = 100;
              const barH = Math.max((item.score / 100) * maxHeight, 8);
              return (
                <View key={idx} style={styles.barCol}>
                  <Text style={styles.barValue}>{item.score}</Text>
                  <View style={[styles.bar, { height: barH }]} />
                  <Text style={styles.barLabel}>
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t.technique_breakdown}</Text>
        <View style={styles.techniqueCard}>
          {TECHNIQUE_KEYS.map(({ key, label }) => {
            const score = progress.technique_averages?.[key] || 0;
            return (
              <View key={key} style={styles.techniqueRow}>
                <Text style={styles.techniqueName}>{(t as any)[label]}</Text>
                <View style={styles.techniqueBarBg}>
                  <View style={[styles.techniqueBarFill, { width: `${score}%` }]} />
                </View>
                <Text style={styles.techniqueScore}>{score}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.default },
  center: { flex: 1, backgroundColor: theme.colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  title: { fontSize: theme.font.xl, fontWeight: '800', color: theme.colors.text.primary, paddingTop: 16, marginBottom: 20 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: theme.font.sm, color: theme.colors.text.tertiary },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: theme.font.xxl, fontWeight: '800', color: theme.colors.text.primary },
  statLabel: { fontSize: theme.font.xs, color: theme.colors.text.tertiary, marginTop: 2 },
  improvementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  improvementText: { fontSize: theme.font.md, fontWeight: '700' },
  sectionTitle: { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 12 },
  chartCard: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 20,
    marginBottom: 24,
  },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 140 },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 10, color: theme.colors.text.secondary, marginBottom: 4 },
  bar: { width: 20, backgroundColor: theme.colors.brand.primary, borderRadius: 4 },
  barLabel: { fontSize: 9, color: theme.colors.text.tertiary, marginTop: 6 },
  techniqueCard: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 20,
    gap: 16,
    marginBottom: 24,
  },
  techniqueRow: { flexDirection: 'row', alignItems: 'center' },
  techniqueName: { fontSize: theme.font.xs, color: theme.colors.text.secondary, width: 100 },
  techniqueBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  techniqueBarFill: { height: '100%', backgroundColor: theme.colors.brand.primary, borderRadius: 4 },
  techniqueScore: { fontSize: theme.font.xs, color: theme.colors.text.primary, fontWeight: '700', width: 28, textAlign: 'right' },
});
