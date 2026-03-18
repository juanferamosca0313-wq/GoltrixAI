import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Animated,
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const phases = [t.uploading_video, t.ai_analyzing, t.generating_report];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [step]);

  useEffect(() => {
    if (step === 'analyzing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [step]);

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
      fadeAnim.setValue(0);
      bounceAnim.setValue(0.9);
    }
  }

  async function analyzeVideo() {
    if (!video) return;
    setStep('analyzing');
    setAnalysisPhase(0);
    fadeAnim.setValue(0);
    bounceAnim.setValue(0.9);

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
      fadeAnim.setValue(0);
      bounceAnim.setValue(0.9);
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
    fadeAnim.setValue(0);
    bounceAnim.setValue(0.9);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} testID="upload-screen">
        <Text style={styles.title}>{t.upload}</Text>

        {step === 'idle' && (
          <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
            <TouchableOpacity testID="upload-pick-button" style={styles.pickButton} onPress={pickVideo} activeOpacity={0.8}>
              <View style={styles.iconCircle}>
                <Ionicons name="cloud-upload-outline" size={44} color={theme.colors.brand.primary} />
              </View>
              <Text style={styles.pickTitle}>{t.pick_video}</Text>
              <Text style={styles.pickSubtitle}>{t.upload_subtitle}</Text>

              <View style={styles.stepsRow}>
                <View style={styles.miniStep}>
                  <Ionicons name="videocam" size={16} color={theme.colors.brand.primary} />
                  <Text style={styles.miniStepText}>{t.step1_title}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={theme.colors.text.tertiary} />
                <View style={styles.miniStep}>
                  <Ionicons name="cloud-upload" size={16} color={theme.colors.brand.primary} />
                  <Text style={styles.miniStepText}>{t.step2_title}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={theme.colors.text.tertiary} />
                <View style={styles.miniStep}>
                  <Ionicons name="flash" size={16} color={theme.colors.brand.primary} />
                  <Text style={styles.miniStepText}>{t.step3_title}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 'selected' && video && (
          <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
            <View style={styles.videoCard}>
              <View style={styles.videoIconWrap}>
                <Ionicons name="film-outline" size={28} color={theme.colors.brand.secondary} />
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoLabel}>{t.video_selected}</Text>
                <Text style={styles.videoName} numberOfLines={1}>{video.fileName || 'video.mp4'}</Text>
              </View>
              <TouchableOpacity onPress={pickVideo} style={styles.changeBtn}>
                <Text style={styles.changeText}>{t.change_video}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity testID="upload-analyze-button" style={styles.analyzeButton} onPress={analyzeVideo} activeOpacity={0.8}>
              <Ionicons name="flash" size={22} color={theme.colors.text.inverse} />
              <Text style={styles.analyzeText}>{t.analyze_shot}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 'analyzing' && (
          <View style={styles.centerContent} testID="upload-loading">
            <Animated.View style={[styles.analyzeIconWrap, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="flash" size={40} color={theme.colors.brand.primary} />
            </Animated.View>
            <Text style={styles.analyzingTitle}>{t.analyzing}</Text>
            <View style={styles.phaseList}>
              {phases.map((phase, i) => (
                <Animated.View key={i} style={styles.phaseRow}>
                  <Ionicons
                    name={i < analysisPhase ? 'checkmark-circle' : i === analysisPhase ? 'ellipse' : 'ellipse-outline'}
                    size={20}
                    color={i <= analysisPhase ? theme.colors.brand.primary : theme.colors.text.tertiary}
                  />
                  <Text style={[styles.phaseText, i <= analysisPhase && styles.phaseActive]}>
                    {phase}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {step === 'done' && result && (
          <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
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
              <Ionicons name="eye-outline" size={20} color={theme.colors.text.inverse} />
              <Text style={styles.analyzeText}>{t.view_details}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newButton} onPress={reset} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={styles.newText}>{t.pick_video}</Text>
            </TouchableOpacity>
          </Animated.View>
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
  title: { fontSize: theme.font.xl, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  pickButton: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  pickTitle: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 6 },
  pickSubtitle: { fontSize: theme.font.sm, color: theme.colors.text.tertiary, marginBottom: 20 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  miniStep: { alignItems: 'center', gap: 4 },
  miniStepText: { fontSize: 10, color: theme.colors.text.secondary },
  videoCard: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.brand.primary + '40',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  videoIconWrap: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center', alignItems: 'center',
  },
  videoInfo: { flex: 1 },
  videoLabel: { fontSize: theme.font.xs, color: theme.colors.brand.primary, fontWeight: '600' },
  videoName: { fontSize: theme.font.sm, color: theme.colors.text.primary, fontWeight: '600', marginTop: 2 },
  changeBtn: { padding: 8 },
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
    shadowColor: theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  analyzeText: { color: theme.colors.text.inverse, fontWeight: '700', fontSize: theme.font.base },
  analyzeIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  analyzingTitle: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 20 },
  phaseList: { gap: 14 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phaseText: { fontSize: theme.font.sm, color: theme.colors.text.tertiary },
  phaseActive: { color: theme.colors.text.primary, fontWeight: '600' },
  resultScoreWrap: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: theme.colors.brand.primaryDim,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: theme.colors.brand.primary,
    marginBottom: 16,
    shadowColor: theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  resultScore: { fontSize: theme.font.xxxl, fontWeight: '900', color: theme.colors.brand.primary },
  resultLabel: { fontSize: theme.font.xs, color: theme.colors.text.secondary },
  completeText: { fontSize: theme.font.lg, fontWeight: '700', color: theme.colors.status.success, marginBottom: 24 },
  newButton: { marginTop: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  newText: { fontSize: theme.font.sm, color: theme.colors.text.secondary, fontWeight: '600' },
  errorText: { fontSize: theme.font.base, color: theme.colors.status.error, marginTop: 12, marginBottom: 24, textAlign: 'center' },
});
