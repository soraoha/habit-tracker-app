import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits } from '@/hooks/useHabits';
import { useRecords, currentMonth, today } from '@/hooks/useRecords';

export default function StatsScreen() {
  const { user } = useAuth();
  const { habits } = useHabits(user?.uid);
  const { records } = useRecords(user?.uid, currentMonth());

  const todayStr = today();
  const monthStr = currentMonth();
  const [year, month] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysPassed = parseInt(todayStr.split('-')[2]);

  const activeHabits = habits.filter((h) => h.isActive);

  const statsPerHabit = activeHabits.map((habit) => {
    const monthRecords = records.filter((r) => r.habitId === habit.id && r.completed);
    const completedDays = monthRecords.length;
    const rate = daysPassed > 0 ? Math.round((completedDays / daysPassed) * 100) : 0;

    // 連続記録日数（今日から遡る）
    let streak = 0;
    for (let i = 0; i < daysPassed; i++) {
      const d = new Date(year, month - 1, daysPassed - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (records.some((r) => r.habitId === habit.id && r.date === dateStr && r.completed)) {
        streak++;
      } else {
        break;
      }
    }

    return { habit, completedDays, rate, streak };
  });

  const todayTotal = records.filter((r) => r.date === todayStr && r.completed).length;
  const monthTotal = records.filter((r) => r.completed).length;
  const monthPossible = activeHabits.length * daysPassed;
  const overallRate = monthPossible > 0 ? Math.round((monthTotal / monthPossible) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>今月の概要（{month}月）</Text>
      <View style={styles.summaryRow}>
        <StatCard label="今日の達成" value={`${todayTotal}/${activeHabits.length}`} color="#007AFF" />
        <StatCard label="今月の達成率" value={`${overallRate}%`} color="#34C759" />
        <StatCard label="習慣数" value={`${activeHabits.length}`} color="#FF9500" />
      </View>

      <Text style={styles.sectionTitle}>習慣別の達成状況</Text>
      {statsPerHabit.length === 0 && (
        <Text style={styles.empty}>習慣を追加してください</Text>
      )}
      {statsPerHabit.map(({ habit, completedDays, rate, streak }) => (
        <View key={habit.id} style={styles.habitCard}>
          <View style={styles.habitHeader}>
            <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
            <Text style={styles.habitName}>{habit.name}</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${rate}%`, backgroundColor: habit.color }]} />
          </View>
          <View style={styles.habitStats}>
            <Text style={styles.statText}>{completedDays}/{daysPassed}日達成（{rate}%）</Text>
            <Text style={styles.streakText}>🔥 連続 {streak}日</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginTop: 8 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4, textAlign: 'center' },
  empty: { color: '#8E8E93', textAlign: 'center', padding: 20 },
  habitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  habitHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  habitName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  barBg: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  habitStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statText: { fontSize: 13, color: '#8E8E93' },
  streakText: { fontSize: 13, color: '#FF9500', fontWeight: '600' },
});
