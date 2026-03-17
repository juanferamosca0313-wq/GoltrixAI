import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type AnalysisStep = 'idle' | 'selected' | 'analyzing' | 'done' | 'error';

export default function Upload() {
  const { t } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<AnalysisStep>('idle');
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [analysisPhase, setAnalysisPhase] = useState(0);

  const phases = [t.uploading_video, t.ai_analyzing, t.generating_report];

  async function pickVideo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.error, 'Permission required');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.5,
      videoMaxDuration: 60,
    });
    if (!res.canceled && res.assets[0]) {
      setVideo(res.assets[0]);
      setStep('selected');
      setResult(null);
      setErrorMsg('');
    }
  }

  async function analyzeVideo() {
    if (!video) return;
    setStep('analyzing');
    setAnalysisPhase(0);

    const phaseTimer = setInterval(() => {
      setAnalysisPhase(prev => Math.min(prev + 1, 2));
    }, 12000);

    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const resp = await fetch(video.uri);
        const blob = await resp.blob();
        formData.append('file', blob, video.fileName || 'video.mp4');
      } else {
        formData.append('file', {
          uri: video.uri,
          name: video.fileName || 'video.mp4',
          type: video.mimeType || 'video/mp4',
        } as any);
      }

      const analysis = await api.analyzeVideo(formData);
      setResult(analysis);
      setStep('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'Analysis failed');
      setStep('error');
    } finally {
      clearInterval(phaseTimer);
    }
  }

  function reset() {
    setStep('idle');
    setVideo(null);
    setResult(null);
    setErrorMsg('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} testID="upload-screen">
        <Text style={styles.title}>{t.upload}</Text>

        {step === 'idle' && (
          <View style={styles.centerContent}>
            <TouchableOpacity testID="upload-pick-button" style={styles.pickButton} onPress={pickVideo} activeOpacity={0.8}>
              <View style={styles.iconCircle}>
                <Ionicons name="cloud-upload-outline" size={40} color={theme.colors.brand.primary} />
              </View>
              <Text style={styles.pickTitle}>{t.pick_video}</Text>
              <Text style={styles.pickSubtitle}>{t.upload_subtitle}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'selected' && video && (
          <View style={styles.centerContent}>
            <View style={styles.videoCard}>
              <Ionicons name="film-outline" size={32} color={theme.colors.brand.secondary} />
              <Text style={styles.videoName} numberOfLines={1}>{video.fileName || 'video.mp4'}</Text>
              <TouchableOpacity onPress={pickVideo}>
                <Text style={styles.changeText}>{t.change_video}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity testID="upload-analyze-button" style={styles.analyzeButton} onPress={analyzeVideo} activeOpacity={0.8}>
              <Ionicons name="flash" size={20} color={theme.colors.text.inverse} />
              <Text style={styles.analyzeText}>{t.analyze_shot}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'analyzing' && (
          <View style={styles.centerContent} testID="upload-loading">
            <ActivityIndicator size="large" color={theme.colors.brand.primary} style={styles.loader} />
            <Text style={styles.analyzingTitle}>{t.analyzing}</Text>
            {phases.map((phase, i) => (
              <View key={i} style={styles.phaseRow}>
                <Ionicons
                  name={i <= analysisPhase ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={i <= analysisPhase ? theme.colors.status.success : theme.colors.text.tertiary}
                />
                <Text style={[styles.phaseText, i <= analysisPhase && styles.phaseActive]}>
                  {phase}
                </Text>
              </View>
            ))}
          </View>
        )}

        {step === 'done' && result && (
          <View style={styles.centerContent}>
            <View style={styles.resultScoreWrap}>
              <Text style={styles.resultScore}>{result.overall_score}</Text>
              <Text style={styles.resultLabel}>{t.overall_score}</Text>
            </View>
            <Text style={styles.completeText}>{t.analysis_complete}</Text>
            <TouchableOpacity
              testID="upload-view-details"
              style={styles.analyzeButton}
              onPress={() => router.push(`/analysis/${result.id}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.analyzeText}>{t.view_details}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newButton} onPress={reset} activeOpacity={0.8}>
              <Text style={styles.newText}>{t.pick_video}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'error' && (
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.status.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity style={styles.analyzeButton} onPress={analyzeVideo} activeOpacity={0.8}>
              <Text style={styles.analyzeText}>{t.retry}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newButton} onPress={reset} activeOpacity={0.8}>
              <Text style={styles.newText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.default },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: theme.font.xl, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 24 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  pickButton: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickTitle: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  pickSubtitle: { fontSize: theme.font.sm, color: theme.colors.text.tertiary },
  videoCard: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  videoName: { flex: 1, fontSize: theme.font.sm, color: theme.colors.text.primary, fontWeight: '600' },
  changeText: { fontSize: theme.font.sm, color: theme.colors.brand.primary, fontWeight: '600' },
  analyzeButton: {
    backgroundColor: theme.colors.brand.primary,
    height: 56,
    borderRadius: theme.radius.full,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  analyzeText: { color: theme.colors.text.inverse, fontWeight: '700', fontSize: theme.font.base },
  loader: { marginBottom: 24 },
  analyzingTitle: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 24 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  phaseText: { fontSize: theme.font.sm, color: theme.colors.text.tertiary },
  phaseActive: { color: theme.colors.text.primary },
  resultScoreWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.brand.primary,
    marginBottom: 16,
  },
  resultScore: { fontSize: theme.font.xxxl, fontWeight: '900', color: theme.colors.brand.primary },
  resultLabel: { fontSize: theme.font.xs, color: theme.colors.text.secondary },
  completeText: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.status.success, marginBottom: 24 },
  newButton: { marginTop: 16, padding: 12 },
  newText: { fontSize: theme.font.sm, color: theme.colors.text.secondary, fontWeight: '600' },
  errorText: { fontSize: theme.font.base, color: theme.colors.status.error, marginTop: 12, marginBottom: 24, textAlign: 'center' },
});
