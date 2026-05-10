import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits } from '@/hooks/useHabits';
import { useRecords, today } from '@/hooks/useRecords';

const COLORS = ['#4A90E2', '#7ED321', '#F5A623', '#D0021B', '#9B59B6', '#2ECC71'];

export default function HabitListScreen() {
  const { user } = useAuth();
  const { habits, addHabit, deleteHabit, refetch: refetchHabits } = useHabits(user?.uid);
  const { records, toggleRecord } = useRecords(user?.uid);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const todayStr = today();
  const unrecorded = habits.filter(
    (h) => h.isActive && !records.some((r) => r.date === todayStr && r.habitId === h.id && r.completed)
  );

  const handleAdd = async () => {
    if (!newName.trim()) return Alert.alert('エラー', '習慣名を入力してください');
    await addHabit(newName.trim(), selectedColor);
    setNewName('');
    setSelectedColor(COLORS[0]);
    setShowAdd(false);
  };

  const handleToggle = async (habitId: string) => {
    const existing = records.find((r) => r.date === todayStr && r.habitId === habitId);
    await toggleRecord(habitId, todayStr, !existing?.completed);
  };

  const handleDelete = (habitId: string, name: string) => {
    Alert.alert('削除確認', `「${name}」を削除しますか？\n記録も一緒に削除されます。`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deleteHabit(habitId) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 未記録バナー */}
      {unrecorded.length > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            今日の記録がまだの習慣が {unrecorded.length} 件あります
          </Text>
        </View>
      )}

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>習慣を追加してみましょう！</Text>
        }
        renderItem={({ item }) => {
          const rec = records.find((r) => r.date === todayStr && r.habitId === item.id);
          const done = rec?.completed ?? false;
          return (
            <View style={styles.item}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={[styles.habitName, done && styles.habitDone]}>{item.name}</Text>
              <Pressable onPress={() => handleToggle(item.id)} style={styles.checkBtn}>
                <FontAwesome
                  name={done ? 'check-circle' : 'circle-o'}
                  size={28}
                  color={done ? item.color : '#C7C7CC'}
                />
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
                <FontAwesome name="trash-o" size={20} color="#FF3B30" />
              </Pressable>
            </View>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </Pressable>

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>習慣を追加</Text>
          <TextInput
            style={styles.input}
            placeholder="例：毎日30分読書する"
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <Text style={styles.colorLabel}>カラー</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorChip,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorChipSelected,
                ]}
              />
            ))}
          </View>
          <Pressable style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>追加する</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  banner: {
    backgroundColor: '#FF9500',
    padding: 12,
    margin: 12,
    borderRadius: 10,
  },
  bannerText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  list: { padding: 12, gap: 10 },
  empty: { textAlign: 'center', color: '#8E8E93', marginTop: 48, fontSize: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  habitName: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  habitDone: { color: '#8E8E93', textDecorationLine: 'line-through' },
  checkBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  colorLabel: { fontSize: 14, color: '#8E8E93', marginBottom: 8 },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  colorChip: { width: 36, height: 36, borderRadius: 18 },
  colorChipSelected: { borderWidth: 3, borderColor: '#1C1C1E' },
  addBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
