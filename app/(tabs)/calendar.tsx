import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useHabits } from '@/hooks/useHabits';
import { useRecords, currentMonth, today } from '@/hooks/useRecords';

const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const [monthStr, setMonthStr] = useState(currentMonth());
  const { habits } = useHabits(user?.uid);
  const { records } = useRecords(user?.uid, monthStr);

  const parts = monthStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const daysInMonth = getDaysInMonth(year, month - 1);
  const todayStr = today();

  // 月の1日が何曜日か (0=日, 6=土)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const goToPrevMonth = () => {
    if (month === 1) {
      setMonthStr(`${year - 1}-12`);
    } else {
      setMonthStr(`${year}-${String(month - 1).padStart(2, '0')}`);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonthStr(`${year + 1}-01`);
    } else {
      setMonthStr(`${year}-${String(month + 1).padStart(2, '0')}`);
    }
  };

  const activeHabits = habits.filter(h => h.isActive);

  const completionRate = (date: string) => {
    if (activeHabits.length === 0) return null;
    const done = records.filter(r => r.date === date && r.completed).length;
    return done / activeHabits.length;
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    router.navigate('/(tabs)');
  };

  // セル配列を作成（先頭に空白を追加）
  const cells: (string | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${monthStr}-${String(d).padStart(2, '0')}`;
    }),
  ];
  // 7の倍数になるよう末尾を埋める
  while (cells.length % 7 !== 0) cells.push(null);

  // 7列ごとに行に分割
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* 月ナビゲーション */}
      <View style={styles.nav}>
        <Pressable onPress={goToPrevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{year}年 {month}月</Text>
        <Pressable onPress={goToNextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{'>'}</Text>
        </Pressable>
      </View>

      {/* 曜日ヘッダー */}
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((d, i) => (
          <Text
            key={d}
            style={[
              styles.weekDay,
              i === 0 && styles.sundayText,
              i === 6 && styles.saturdayText,
            ]}>
            {d}
          </Text>
        ))}
      </View>

      <ScrollView>
        <View style={styles.grid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((date, colIdx) => {
                if (!date) {
                  return <View key={`empty-${rowIdx}-${colIdx}`} style={styles.dayCell} />;
                }
                const rate = completionRate(date);
                const dayNum = parseInt(date.split('-')[2]);
                const isToday = date === todayStr;
                const isSelected = date === selectedDate;

                let dotColor = '#E5E5EA';
                if (rate !== null) {
                  dotColor = rate === 1 ? '#34C759' : rate > 0 ? '#FF9500' : '#E5E5EA';
                }

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
                      colIdx === 0 && styles.sundayText,
                      colIdx === 6 && styles.saturdayText,
                      isToday && styles.dayNumToday,
                      isSelected && styles.dayNumSelected,
                    ]}>
                      {dayNum}
                    </Text>
                    {rate !== null && (
                      <View style={[styles.dot, { backgroundColor: dotColor }]} />
                    )}
                    <Text style={styles.rateText}>
                      {rate !== null ? `${Math.round(rate * 100)}%` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
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
  navText: { fontSize: 22, color: '#007AFF', fontWeight: '600' },
  monthLabel: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
    paddingVertical: 8,
  },
  weekDay: {
    flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#8E8E93',
  },
  sundayText: { color: '#FF3B30' },
  saturdayText: { color: '#007AFF' },
  grid: { padding: 4, backgroundColor: '#F2F2F7' },
  row: { flexDirection: 'row', marginBottom: 4 },
  dayCell: {
    flex: 1, alignItems: 'center', paddingVertical: 6,
    backgroundColor: '#fff', borderRadius: 8, marginHorizontal: 2,
    borderWidth: 1.5, borderColor: 'transparent',
    minHeight: 72,
  },
  dayCellToday: {
    borderColor: '#007AFF', backgroundColor: '#EAF3FF',
  },
  dayCellSelected: {
    borderColor: '#FF9500', backgroundColor: '#FFF3E0',
  },
  dayNum: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  dayNumToday: { color: '#007AFF' },
  dayNumSelected: { color: '#FF9500' },
  dot: { width: 18, height: 18, borderRadius: 9, marginBottom: 2 },
  rateText: { fontSize: 9, color: '#8E8E93' },
  legend: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
    gap: 10, padding: 10, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E5EA',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: '#8E8E93' },
});
