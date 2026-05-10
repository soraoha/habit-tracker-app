import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { user, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // リダイレクト方式：Google から戻ってきたとき user が確定したら自動遷移
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // signInWithRedirect はページを離れるため、ここには到達しない
      // 戻ってきたら上の useEffect が遷移を処理する
    } catch (e: any) {
      setError(e.message ?? 'Google ログインに失敗しました');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>✅</Text>
        <Text style={styles.title}>習慣トラッカー</Text>
        <Text style={styles.subtitle}>
          毎日の習慣を記録して{'\n'}継続力を身につけよう
        </Text>

        <Pressable
          style={[styles.googleBtn, loading && styles.btnDisabled]}
          onPress={handleGoogle}
          disabled={loading}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>
            {loading ? 'Googleへ移動中...' : 'Google でログイン'}
          </Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.note}>
          ログインするとデータがクラウドに保存され{'\n'}
          どのデバイスからでもアクセスできます
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  btnDisabled: { opacity: 0.5 },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4', width: 24, textAlign: 'center' },
  googleText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  errorText: { color: '#FF3B30', fontSize: 13, marginTop: 12, textAlign: 'center' },
  note: {
    fontSize: 12,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 24,
  },
});
