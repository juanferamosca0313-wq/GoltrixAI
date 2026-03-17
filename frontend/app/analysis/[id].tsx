import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const TECHNIQUE_LABELS: Record<string, string> = {
  body_position: 'body_position',
  foot_placement: 'foot_placement',
  follow_through: 'follow_through',
  approach_angle: 'approach_angle',
  power_generation: 'power_generation',
};

export default function AnalysisDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getAnalysis(id).then(setAnalysis).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t.error}</Text>
      </View>
    );
  }

  function getScoreColor(score: number) {
    if (score >= 80) return theme.colors.status.success;
    if (score >= 60) return theme.colors.status.warning;
    return theme.colors.status.error;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="analysis-back-button" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.analysis}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        testID="analysis-detail-screen"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scoreSection}>
          <View style={[styles.bigScore, { borderColor: getScoreColor(analysis.overall_score) }]}>
            <Text style={[styles.bigScoreNum, { color: getScoreColor(analysis.overall_score) }]}>
              {analysis.overall_score}
            </Text>
            <Text style={styles.bigScoreLabel}>{t.overall_score}</Text>
          </View>
          <Text style={styles.filename}>{analysis.filename}</Text>
          <Text style={styles.date}>{new Date(analysis.created_at).toLocaleDateString()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.technique_breakdown}</Text>
          {Object.entries(analysis.technique_scores || {}).map(([key, score]) => (
            <View key={key} style={styles.techniqueRow}>
              <Text style={styles.techniqueName}>
                {(t as any)[TECHNIQUE_LABELS[key] || key] || key}
              </Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${score as number}%`, backgroundColor: getScoreColor(score as number) }]} />
              </View>
              <Text style={[styles.techniqueScore, { color: getScoreColor(score as number) }]}>
                {score as number}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.feedback}</Text>
          <Text style={styles.feedbackText}>{analysis.feedback}</Text>
        </View>

        {analysis.corrections?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.corrections}</Text>
            {analysis.corrections.map((item: string, i: number) => (
              <View key={i} style={styles.listItem}>
                <Ionicons name="alert-circle" size={18} color={theme.colors.status.warning} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {analysis.tips?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.tips}</Text>
            {analysis.tips.map((item: string, i: number) => (
              <View key={i} style={styles.listItem}>
                <Ionicons name="bulb" size={18} color={theme.colors.brand.primary} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {analysis.exercises?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.exercises}</Text>
            {analysis.exercises.map((item: string, i: number) => (
              <View key={i} style={styles.listItem}>
                <Ionicons name="fitness" size={18} color={theme.colors.brand.secondary} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.default },
  center: { flex: 1, backgroundColor: theme.colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: theme.colors.status.error, fontSize: theme.font.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text.primary },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  scoreSection: { alignItems: 'center', marginBottom: 24 },
  bigScore: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    backgroundColor: theme.colors.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  bigScoreNum: { fontSize: theme.font.xxxl, fontWeight: '900' },
  bigScoreLabel: { fontSize: theme.font.xs, color: theme.colors.text.secondary, marginTop: 2 },
  filename: { fontSize: theme.font.sm, color: theme.colors.text.secondary, fontWeight: '600' },
  date: { fontSize: theme.font.xs, color: theme.colors.text.tertiary, marginTop: 4 },
  card: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: { fontSize: theme.font.md, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 16 },
  techniqueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  techniqueName: { fontSize: theme.font.xs, color: theme.colors.text.secondary, width: 95 },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },
  techniqueScore: { fontSize: theme.font.sm, fontWeight: '700', width: 30, textAlign: 'right' },
  feedbackText: { fontSize: theme.font.sm, color: theme.colors.text.secondary, lineHeight: 22 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  listText: { flex: 1, fontSize: theme.font.sm, color: theme.colors.text.secondary, lineHeight: 20 },
});
