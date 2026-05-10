import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'login' | 'signup' | 'reset';

export default function LoginScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return Alert.alert('エラー', 'メールアドレスを入力してください');
    if (mode !== 'reset' && !password.trim())
      return Alert.alert('エラー', 'パスワードを入力してください');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        router.replace('/(tabs)');
      } else if (mode === 'signup') {
        await signUp(email, password);
        router.replace('/(tabs)');
      } else {
        await resetPassword(email);
        Alert.alert('送信完了', 'パスワードリセットメールを送りました');
        setMode('login');
      }
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? '操作に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, string> = {
    login: 'ログイン',
    signup: '新規登録',
    reset: 'パスワードリセット',
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>習慣トラッカー</Text>
        <Text style={styles.subtitle}>{titles[mode]}</Text>

        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        {mode !== 'reset' && (
          <TextInput
            style={styles.input}
            placeholder="パスワード（6文字以上）"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        )}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? '処理中...' : titles[mode]}
          </Text>
        </Pressable>

        <View style={styles.links}>
          {mode !== 'login' && (
            <Pressable onPress={() => setMode('login')}>
              <Text style={styles.link}>ログインに戻る</Text>
            </Pressable>
          )}
          {mode === 'login' && (
            <>
              <Pressable onPress={() => setMode('signup')}>
                <Text style={styles.link}>アカウントを作成</Text>
              </Pressable>
              <Pressable onPress={() => setMode('reset')}>
                <Text style={styles.link}>パスワードを忘れた場合</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
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
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { backgroundColor: '#A2C4FF' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  links: { marginTop: 20, gap: 12, alignItems: 'center' },
  link: { color: '#007AFF', fontSize: 14 },
});
