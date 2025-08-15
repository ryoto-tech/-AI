import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Alert, Platform, ToastAndroid } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { ensureChild, getUsageToday, askConversation } from '../api/client';

export default function ChatScreen() {
  const [childId, setChildId] = useState<string>('');
  const [remaining, setRemaining] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [ttsUrl, setTtsUrl] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const id = await ensureChild();
        setChildId(id);
        await refreshQuota(id);
      } catch (e: any) {
        toast('初期化エラー', e.message);
      }
    })();
  }, []);

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
      const res = await askConversation({ child_id: childId, audio_base64: base64 });
      setAnswer(res.answer_text);
      setTtsUrl(res.tts_audio_url);
      await refreshQuota();
      // 再生
      if (res.tts_audio_url) {
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: absoluteUrl(res.tts_audio_url) });
        await sound.playAsync();
      }
    } catch (e: any) {
      toast('送信エラー', e.message);
    } finally {
      setLoading(false);
    }
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
        <Image source={{ uri: (recording || loading) ? 'https://dummyimage.com/200x200/ffd1a1/333&text=%F0%9F%95%8A%EF%B8%8F%E3%81%8F%E3%81%BE' : 'https://dummyimage.com/200x200/ffd1a1/333&text=%E3%81%8F%E3%81%BE' }} style={{ width: 200, height: 200, borderRadius: 100, opacity: recording || loading ? 0.7 : 1 }} />
        <Text style={{ marginTop: 16, fontSize: 18 }}>{answer || 'こんにちは！マイクをおしてね。'}</Text>
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
            disabled={!childId}
          >
            <Text style={{ color: 'white', fontSize: 20 }}>🎤 なぜ？</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
