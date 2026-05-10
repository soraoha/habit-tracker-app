import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { user, logOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          await logOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* settings.tsx 内で headerShown を有効化して戻るボタンを表示 */}
      <Stack.Screen options={{ title: '設定', headerShown: true }} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント</Text>
        <View style={styles.row}>
          <FontAwesome name="envelope-o" size={18} color="#8E8E93" style={styles.rowIcon} />
          <Text style={styles.rowText}>{user?.email ?? '未ログイン'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知について</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            現在、アプリを開いたときに未記録の習慣をホーム画面にバナーで表示しています。{'\n\n'}
            バックグラウンドでのプッシュ通知は今後のアップデートで対応予定です。
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データについて</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            すべての習慣データは Firebase Firestore にクラウド保存されます。{'\n'}
            別のデバイスでも同じアカウントでログインすることでデータを引き継げます。
          </Text>
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <FontAwesome name="sign-out" size={18} color="#FF3B30" style={styles.rowIcon} />
        <Text style={styles.logoutText}>ログアウト</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginBottom: 8, paddingLeft: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  rowIcon: { width: 24, textAlign: 'center' },
  rowText: { fontSize: 15, color: '#1C1C1E', flex: 1 },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoText: { fontSize: 14, color: '#3C3C43', lineHeight: 20 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, color: '#FF3B30', fontWeight: '600' },
});
