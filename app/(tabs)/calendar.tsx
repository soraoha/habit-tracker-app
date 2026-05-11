import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useHabits } from '@/hooks/useHabits';
import { useRecords, currentMonth, today } from '@/hooks/useRecords';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const [monthStr, setMonthStr] = useState(currentMonth());
  const { habits } = useHabits(user?.uid);
  const { records } = useRecords(user?.uid, monthStr);

  const [year, month] = monthStr.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, month - 1);
  const todayStr = today();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${monthStr}-${String(d).padStart(2, '0')}`;
  });

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setMonthStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setMonthStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const activeHabits = habits.filter(h => h.isActive);

  const completionRate = (date: string) => {
    if (activeHabits.length === 0) return 0;
    const done = records.filter(r => r.date === date && r.completed).length;
    return done / activeHabits.length;
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    // 習慣一覧タブへ移動
    router.navigate('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* 月ナビゲーション */}
      <View style={styles.nav}>
        <Pressable onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{year}年 {month}月</Text>
        <Pressable onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{'>'}</Text>
        </Pressable>
      </View>

      {/* 操作説明 */}
      <View style={styles.hint}>
        <Text style={styles.hintText}>日付をタップ → その日の習慣記録画面へ移動</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {days.map(date => {
          const rate = completionRate(date);
          const dayNum = parseInt(date.split('-')[2]);
          const isToday = date === todayStr;
          const isSelected = date === selectedDate;

          return (
            <Pressable
              key={date}
              onPress={() => handleDayPress(date)}
              style={[
                styles.dayCell,
                isToday && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
              ]}>
              <Text style={[
                styles.dayNum,
                isToday && styles.dayNumToday,
                isSelected && styles.dayNumSelected,
              ]}>
                {dayNum}
              </Text>
              <View style={[
                styles.dot,
                {
                  backgroundColor:
                    rate === 0 ? '#E5E5EA' : rate === 1 ? '#34C759' : '#FF9500',
                },
              ]} />
              <Text style={styles.rateText}>
                {activeHabits.length > 0 ? `${Math.round(rate * 100)}%` : '-'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 凡例 */}
      <View style={styles.legend}>
        {[
          { color: '#34C759', label: '全完了' },
          { color: '#FF9500', label: '一部完了' },
          { color: '#E5E5EA', label: '未記録' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderWidth: 2, borderColor: '#007AFF', backgroundColor: '#EAF3FF' }]} />
          <Text style={styles.legendText}>今日</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderWidth: 2, borderColor: '#FF9500', backgroundColor: '#FFF3E0' }]} />
          <Text style={styles.legendText}>選択中</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
  },
  navBtn: { padding: 8 },
  navText: { fontSize: 20, color: '#007AFF', fontWeight: '600' },
  monthLabel: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  hint: { backgroundColor: '#F2F2F7', padding: 8, alignItems: 'center' },
  hintText: { fontSize: 12, color: '#8E8E93' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 4 },
  dayCell: {
    width: '13%', alignItems: 'center', padding: 6,
    backgroundColor: '#fff', borderRadius: 8,
    marginHorizontal: '0.5%', marginVertical: 3,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  dayCellToday: {
    borderColor: '#007AFF', backgroundColor: '#EAF3FF',
  },
  dayCellSelected: {
    borderColor: '#FF9500', backgroundColor: '#FFF3E0',
  },
  dayNum: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  dayNumToday: { color: '#007AFF' },
  dayNumSelected: { color: '#FF9500' },
  dot: { width: 20, height: 20, borderRadius: 10, marginBottom: 2 },
  rateText: { fontSize: 9, color: '#8E8E93' },
  legend: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
    gap: 12, padding: 10, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E5EA',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: '#8E8E93' },
});
