import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Animated,
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bounceAnim = useRef(new Animated.Value(0.9)).current;

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
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

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
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.greeting}>
            {t.welcome}, {user?.name?.split(' ')[0]}
          </Text>
        </Animated.View>

        {!hasData ? (
          <Animated.View style={[styles.emptyCard, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="videocam-outline" size={44} color={theme.colors.brand.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t.no_analyses}</Text>
            <Text style={styles.emptyText}>{t.upload_first}</Text>

            <View style={styles.stepsWrap}>
              <StepItem icon="videocam" num="1" title={t.step1_title} desc={t.step1_desc} delay={200} />
              <StepItem icon="cloud-upload" num="2" title={t.step2_title} desc={t.step2_desc} delay={400} />
              <StepItem icon="flash" num="3" title={t.step3_title} desc={t.step3_desc} delay={600} />
            </View>

            <TouchableOpacity
              testID="dashboard-upload-btn"
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/upload')}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={20} color={theme.colors.text.inverse} />
              <Text style={styles.ctaText}>{t.pick_video}</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <StatCard value={progress.total_analyses} label={t.total_analyses} icon="analytics" />
              <StatCard value={progress.average_score} label={t.avg_score} icon="speedometer" />
              <StatCard value={progress.best_score} label={t.best_score} icon="trophy" accent />
            </Animated.View>

            {progress.improvement !== 0 && (
              <Animated.View style={[styles.improvementCard, { opacity: fadeAnim }]}>
                <Ionicons
                  name={progress.improvement > 0 ? 'arrow-up-circle' : 'arrow-down-circle'}
                  size={24}
                  color={progress.improvement > 0 ? theme.colors.status.success : theme.colors.status.error}
                />
                <Text style={[
                  styles.improvementText,
                  { color: progress.improvement > 0 ? theme.colors.status.success : theme.colors.status.error },
                ]}>
                  {progress.improvement > 0 ? '+' : ''}{progress.improvement} {t.points} {t.improvement}
                </Text>
              </Animated.View>
            )}

            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.sectionTitle}>{t.recent_activity}</Text>
              {recentAnalyses.map((a, idx) => (
                <AnimatedCard key={a.id} delay={idx * 100}>
                  <TouchableOpacity
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
                </AnimatedCard>
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
      <Text style={styles.credit}>Desarrollado por Felipe</Text>
    </SafeAreaView>
  );
}

function StepItem({ icon, num, title, desc, delay }: { icon: string; num: string; title: string; desc: string; delay: number }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.stepRow, { opacity: fade, transform: [{ translateX: slide }] }]}>
      <View style={styles.stepIcon}>
        <Text style={styles.stepNum}>{num}</Text>
      </View>
      <View style={styles.stepInfo}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </Animated.View>
  );
}

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  return <Animated.View style={{ opacity: fade }}>{children}</Animated.View>;
}

function StatCard({ value, label, icon, accent }: { value: number; label: string; icon: string; accent?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={18} color={accent ? theme.colors.brand.primary : theme.colors.text.tertiary} style={{ marginBottom: 4 }} />
      <Text style={[styles.statValue, accent && { color: theme.colors.brand.primary }]}>{value}</Text>
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
    padding: 28,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 6 },
  emptyText: { fontSize: theme.font.sm, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  stepsWrap: { width: '100%', marginBottom: 24, gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNum: { fontSize: theme.font.sm, fontWeight: '800', color: theme.colors.brand.primary },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: theme.font.sm, fontWeight: '700', color: theme.colors.text.primary },
  stepDesc: { fontSize: theme.font.xs, color: theme.colors.text.tertiary, marginTop: 1 },
  ctaButton: {
    backgroundColor: theme.colors.brand.primary,
    height: 52,
    borderRadius: theme.radius.full,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: { color: theme.colors.text.inverse, fontWeight: '700', fontSize: theme.font.base },
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.brand.primary,
  },
  scoreText: { fontSize: theme.font.sm, fontWeight: '800', color: theme.colors.brand.primary },
  analysisInfo: { flex: 1, marginLeft: 12 },
  analysisFile: { fontSize: theme.font.sm, fontWeight: '600', color: theme.colors.text.primary },
  analysisDate: { fontSize: theme.font.xs, color: theme.colors.text.tertiary, marginTop: 2 },
  credit: { position: 'absolute', bottom: 8, left: 20, fontSize: 11, color: theme.colors.brand.primary, opacity: 0.6 },
});
