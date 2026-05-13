import { Redirect } from 'expo-router';

// タブバーの「＋」ボタン用ダミースクリーン。直接アクセスされた場合は習慣一覧へ戻す。
export default function AddTabScreen() {
  return <Redirect href="/(tabs)" />;
}
