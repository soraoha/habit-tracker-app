import React, { useState } from 'react';
import {
  Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useHabits } from '@/hooks/useHabits';
import { useRecords, today } from '@/hooks/useRecords';

const COLORS = ['#4A90E2', '#7ED321', '#F5A623', '#D0021B', '#9B59B6', '#2ECC71'];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const day = new Date(y, m - 1, d).getDay();
  return `${y}年${m}月${d}日（${days[day]}）`;
}

export default function HabitListScreen() {
  const { user } = useAuth();
  const { selectedDate } = useSelectedDate();
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits(user?.uid);
  const { records, toggleRecord } = useRecords(user?.uid);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  // 編集用ステート
  const [editingHabit, setEditingHabit] = useState<{ id: string; name: string; color: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(COLORS[0]);

  // 削除確認用ステート
  const [deletingHabit, setDeletingHabit] = useState<{ id: string; name: string } | null>(null);

  const todayStr = today();
  const isToday = selectedDate === todayStr;

  // 選択日付で未記録の習慣（当日のみバナー表示）
  const unrecorded = isToday
    ? habits.filter(h => h.isActive && !records.some(r => r.date === selectedDate && r.habitId === h.id && r.completed))
    : [];

  const handleAdd = async () => {
    if (!newName.trim()) return Alert.alert('エラー', '習慣名を入力してください');
    await addHabit(newName.trim(), selectedColor);
    setNewName(''); setSelectedColor(COLORS[0]); setShowAdd(false);
  };

  const handleToggle = async (habitId: string) => {
    const existing = records.find(r => r.date === selectedDate && r.habitId === habitId);
    await toggleRecord(habitId, selectedDate, !existing?.completed);
  };

  const handleDelete = (habitId: string, name: string) => {
    setDeletingHabit({ id: habitId, name });
  };

  const confirmDelete = async () => {
    if (!deletingHabit) return;
    const habitId = deletingHabit.id;
    setDeletingHabit(null);   // モーダルを先に閉じてからDOMが安定した後に削除
    await deleteHabit(habitId);
  };

  const openEdit = (habit: { id: string; name: string; color: string }) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditColor(habit.color);
  };

  const handleEditSave = async () => {
    if (!editingHabit) return;
    if (!editName.trim()) return Alert.alert('エラー', '習慣名を入力してください');
    await updateHabit(editingHabit.id, { name: editName.trim(), color: editColor });
    setEditingHabit(null);
  };

  return (
    <View style={styles.container}>
      {/* 日付ヘッダー */}
      <View style={[styles.dateHeader, isToday && styles.dateHeaderToday]}>
        <FontAwesome name="calendar" size={14} color={isToday ? '#007AFF' : '#8E8E93'} />
        <Text style={[styles.dateText, isToday && styles.dateTextToday]}>
          {isToday ? `今日  ${formatDate(selectedDate)}` : formatDate(selectedDate)}
        </Text>
      </View>

      {/* 未記録バナー（当日のみ） */}
      {unrecorded.length > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>今日の記録がまだの習慣が {unrecorded.length} 件あります</Text>
        </View>
      )}

      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>習慣を追加してみましょう！</Text>}
        renderItem={({ item }) => {
          const rec = records.find(r => r.date === selectedDate && r.habitId === item.id);
          const done = rec?.completed ?? false;
          return (
            <View style={styles.item}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={[styles.habitName, done && styles.habitDone]}>{item.name}</Text>
              {/* 編集ボタン */}
              <Pressable onPress={() => openEdit(item)} style={styles.iconBtn}>
                <FontAwesome name="pencil" size={16} color="#C7C7CC" />
              </Pressable>
              {/* チェックボタン */}
              <Pressable onPress={() => handleToggle(item.id)} style={styles.iconBtn}>
                <FontAwesome
                  name={done ? 'check-circle' : 'circle-o'}
                  size={28}
                  color={done ? item.color : '#C7C7CC'}
                />
              </Pressable>
              {/* 削除ボタン */}
              <Pressable onPress={() => handleDelete(item.id, item.name)} style={styles.iconBtn}>
                <FontAwesome name="trash-o" size={20} color="#FF3B30" />
              </Pressable>
            </View>
          );
        }}
      />

      {/* 追加ボタン */}
      <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </Pressable>

      {/* 習慣追加モーダル */}
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
            {COLORS.map(c => (
              <Pressable key={c} onPress={() => setSelectedColor(c)}
                style={[styles.colorChip, { backgroundColor: c }, selectedColor === c && styles.colorChipSelected]} />
            ))}
          </View>
          <Pressable style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>追加する</Text>
          </Pressable>
        </View>
      </Modal>

      {/* 習慣編集モーダル */}
      <Modal visible={!!editingHabit} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setEditingHabit(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>習慣を編集</Text>
          <TextInput
            style={styles.input}
            placeholder="習慣名"
            value={editName}
            onChangeText={setEditName}
            autoFocus
          />
          <Text style={styles.colorLabel}>カラー</Text>
          <View style={styles.colorRow}>
            {COLORS.map(c => (
              <Pressable key={c} onPress={() => setEditColor(c)}
                style={[styles.colorChip, { backgroundColor: c }, editColor === c && styles.colorChipSelected]} />
            ))}
          </View>
          <Pressable style={styles.addBtn} onPress={handleEditSave}>
            <Text style={styles.addBtnText}>保存する</Text>
          </Pressable>
        </View>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal visible={!!deletingHabit} transparent animationType="none">
        <Pressable style={styles.overlay} onPress={() => setDeletingHabit(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>削除確認</Text>
          <Text style={styles.deleteMsg}>
            「{deletingHabit?.name}」を削除しますか？{'\n'}記録も一緒に削除されます。
          </Text>
          <View style={styles.deleteActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setDeletingHabit(null)}>
              <Text style={styles.cancelBtnText}>キャンセル</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
              <Text style={styles.deleteBtnText}>削除する</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  dateHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
  },
  dateHeaderToday: { backgroundColor: '#EAF3FF' },
  dateText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  dateTextToday: { color: '#007AFF', fontWeight: '600' },
  banner: {
    backgroundColor: '#FF9500', padding: 12, margin: 12, borderRadius: 10,
  },
  bannerText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  list: { padding: 12, gap: 10 },
  empty: { textAlign: 'center', color: '#8E8E93', marginTop: 48, fontSize: 16 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  habitName: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  habitDone: { color: '#8E8E93', textDecorationLine: 'line-through' },
  iconBtn: { padding: 4 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10,
    padding: 14, fontSize: 16, marginBottom: 16,
  },
  colorLabel: { fontSize: 14, color: '#8E8E93', marginBottom: 8 },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  colorChip: { width: 36, height: 36, borderRadius: 18 },
  colorChipSelected: { borderWidth: 3, borderColor: '#1C1C1E' },
  addBtn: { backgroundColor: '#007AFF', borderRadius: 10, padding: 16, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteMsg: { fontSize: 15, color: '#3C3C43', lineHeight: 22, marginBottom: 24 },
  deleteActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, backgroundColor: '#F2F2F7', borderRadius: 10, padding: 16, alignItems: 'center',
  },
  cancelBtnText: { color: '#1C1C1E', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    flex: 1, backgroundColor: '#FF3B30', borderRadius: 10, padding: 16, alignItems: 'center',
  },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
