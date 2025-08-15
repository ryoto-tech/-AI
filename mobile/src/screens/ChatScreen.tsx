import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Alert, Platform, ToastAndroid, Modal, Animated, Easing } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { ensureChild, getUsageToday, askConversation } from '../api/client';

export default function ChatScreen() {
  const [childId, setChildId] = useState<string>('');
  const [remaining, setRemaining] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [ttsUrl, setTtsUrl] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [ttsVolume, setTtsVolume] = useState<number>(1.0);
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [lastAudioBase64, setLastAudioBase64] = useState<string>('');
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      try {
        const id = await ensureChild();
        setChildId(id);
        await refreshQuota(id);
      } catch (e: any) {
        toast('初期化エラー', e.message);
      }
      // 設定読み込み（音量/はやさ）
      try {
        const raw = await AsyncStorage.getItem('tts_settings');
        if (raw) {
          const s = JSON.parse(raw);
          if (typeof s.volume === 'number') setTtsVolume(s.volume);
          if (typeof s.rate === 'number') setTtsRate(s.rate);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (recording || loading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(pulse, { toValue: 1.0, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [recording, loading]);

  function toast(title: string, message?: string) {
    const msg = message ? `${title}: ${message}` : title;
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert(title, message);
    }
  }

  async function refreshQuota(id = childId) {
    if (!id) return;
    const u = await getUsageToday(id);
    setRemaining(Math.max(0, (u.limit ?? 3) - (u.question_count ?? 0)));
  }

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') { toast('マイク許可が必要です'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    } catch (e: any) {
      toast('録音エラー', e.message);
    }
  }

  async function stopAndSend() {
    if (!recording) return;
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('録音に失敗しました');
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      setLastAudioBase64(base64);
      const res = await askConversation({ child_id: childId, audio_base64: base64 });
      setAnswer(res.answer_text);
      setTtsUrl(res.tts_audio_url);
      await refreshQuota();
      // 再生
      if (res.tts_audio_url) {
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: absoluteUrl(res.tts_audio_url) });
        try { await sound.setVolumeAsync(ttsVolume); } catch {}
        try { await sound.setRateAsync(ttsRate, true); } catch {}
        await sound.playAsync();
      }
    } catch (e: any) {
      toast('送信エラー', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(volume: number, rate: number) {
    setTtsVolume(volume);
    setTtsRate(rate);
    try { await AsyncStorage.setItem('tts_settings', JSON.stringify({ volume, rate })); } catch {}
  }

  function absoluteUrl(url: string) {
    if (/^https?:\/\//.test(url)) return url;
    // @ts-ignore: expo constants type varies by SDK
    const base = (require('expo-constants').default.expoConfig?.extra?.API_BASE_URL || require('expo-constants').default.manifest?.extra?.API_BASE_URL) as string;
    return base.replace(/\/$/, '') + url;
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Animated.Image source={{ uri: (recording || loading) ? 'https://dummyimage.com/200x200/ffd1a1/333&text=%F0%9F%95%8A%EF%B8%8F%E3%81%8F%E3%81%BE' : 'https://dummyimage.com/200x200/ffd1a1/333&text=%E3%81%8F%E3%81%BE' }} style={{ width: 200, height: 200, borderRadius: 100, opacity: recording || loading ? 0.7 : 1, transform: [{ scale: (recording || loading) ? pulse : 1 }] }} />
        <Text style={{ marginTop: 16, fontSize: 18 }}>{answer || 'こんにちは！マイクをおしてね。'}</Text>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={{ marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#eee' }}>
          <Text>⚙️ せってい</Text>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ marginBottom: 12 }}>きょうの のこり: {remaining} かい</Text>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopAndSend}
            style={{ backgroundColor: '#ff8c00', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 60 }}
            disabled={!childId || remaining <= 0}
          >
            <Text style={{ color: 'white', fontSize: 20 }}>{remaining <= 0 ? 'おやすみ' : '🎤 なぜ？'}</Text>
          </TouchableOpacity>
        )}
        {lastAudioBase64 && !loading ? (
          <TouchableOpacity onPress={async () => {
            try {
              setLoading(true);
              const res = await askConversation({ child_id: childId, audio_base64: lastAudioBase64 });
              setAnswer(res.answer_text);
              setTtsUrl(res.tts_audio_url);
              await refreshQuota();
              if (res.tts_audio_url) {
                const sound = new Audio.Sound();
                await sound.loadAsync({ uri: absoluteUrl(res.tts_audio_url) });
                try { await sound.setVolumeAsync(ttsVolume); } catch {}
                try { await sound.setRateAsync(ttsRate, true); } catch {}
                await sound.playAsync();
              }
            } catch (e: any) {
              toast('再送エラー', e.message);
            } finally {
              setLoading(false);
            }
          }} style={{ marginTop: 12 }}>
            <Text style={{ color: '#555' }}>もういちど ▶︎</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>せってい</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text>おんりょう: {ttsVolume.toFixed(1)}</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => saveSettings(Math.max(0, +(ttsVolume - 0.1).toFixed(1)), ttsRate)} style={{ padding: 8 }}><Text>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => saveSettings(Math.min(1, +(ttsVolume + 0.1).toFixed(1)), ttsRate)} style={{ padding: 8 }}><Text>+</Text></TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text>はやさ: {ttsRate.toFixed(1)}x</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => saveSettings(ttsVolume, Math.max(0.5, +(ttsRate - 0.1).toFixed(1)))} style={{ padding: 8 }}><Text>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => saveSettings(ttsVolume, Math.min(1.5, +(ttsRate + 0.1).toFixed(1)))} style={{ padding: 8 }}><Text>+</Text></TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowSettings(false)} style={{ alignSelf: 'flex-end', padding: 8 }}>
              <Text style={{ color: '#007aff' }}>とじる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
