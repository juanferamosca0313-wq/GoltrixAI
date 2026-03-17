import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function History() {
  const { t } = useLanguage();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getAnalyses();
      setAnalyses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  function getScoreColor(score: number) {
    if (score >= 80) return theme.colors.status.success;
    if (score >= 60) return theme.colors.status.warning;
    return theme.colors.status.error;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.history}</Text>
      <FlatList
        testID="history-list"
        data={analyses}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.brand.primary} />}
        contentContainerStyle={analyses.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="time-outline" size={48} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyText}>{t.no_history}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`history-item-${item.id}`}
            style={styles.card}
            onPress={() => router.push(`/analysis/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.overall_score) + '20' }]}>
              <Text style={[styles.scoreNum, { color: getScoreColor(item.overall_score) }]}>
                {item.overall_score}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardFile} numberOfLines={1}>{item.filename}</Text>
              <Text style={styles.cardFeedback} numberOfLines={2}>{item.feedback}</Text>
              <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.default },
  center: { flex: 1, backgroundColor: theme.colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: theme.font.xl, fontWeight: '800', color: theme.colors.text.primary, paddingHorizontal: 20, paddingTop: 16, marginBottom: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', gap: 12 },
  emptyText: { fontSize: theme.font.sm, color: theme.colors.text.tertiary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNum: { fontSize: theme.font.md, fontWeight: '800' },
  cardInfo: { flex: 1, marginLeft: 14 },
  cardFile: { fontSize: theme.font.sm, fontWeight: '700', color: theme.colors.text.primary },
  cardFeedback: { fontSize: theme.font.xs, color: theme.colors.text.secondary, marginTop: 3 },
  cardDate: { fontSize: theme.font.xs, color: theme.colors.text.tertiary, marginTop: 4 },
});
