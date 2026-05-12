import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits } from '@/hooks/useHabits';
import { useRecords } from '@/hooks/useRecords';

type Period = 'week' | 'month' | 'year';

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRange(period: Period) {
  const now = new Date();
  const todayStr = toStr(now);

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { start: toStr(start), end: todayStr, days: 7, label: '過去7日間' };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const days = now.getDate();
    return { start: toStr(start), end: todayStr, days, label: `${now.getMonth() + 1}月` };
  }
  // year
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000) + 1;
  return { start: toStr(startOfYear), end: todayStr, days, label: `${now.getFullYear()}年` };
}

export default function StatsScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('month');

  // SSRのhydration後にのみクライアント描画することでDOM不整合を防ぐ
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { habits } = useHabits(user?.uid);
  const { start, end, days, label } = useMemo(() => getRange(period), [period]);
  const { records } = useRecords(user?.uid, start, end);

  // mountedになるまではローディング表示（SSR DOMとの競合を回避）
  if (!mounted) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const activeHabits = habits.filter((h) => h.isActive);
  const todayStr = toStr(new Date());

  // 全体統計
  const overallCompleted = records.filter((r) => r.completed).length;
  const overallPossible = activeHabits.length * days;
  const overallRate = overallPossible > 0 ? Math.round((overallCompleted / overallPossible) * 100) : 0;
  const todayCompleted = records.filter((r) => r.date === todayStr && r.completed).length;

  // 習慣別統計
  const statsPerHabit = activeHabits.map((habit) => {
    const completed = records.filter((r) => r.habitId === habit.id && r.completed).length;
    const rate = days > 0 ? Math.round((completed / days) * 100) : 0;

    // 今日から遡る連続達成日数
    let streak = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = toStr(d);
      if (records.some((r) => r.habitId === habit.id && r.date === ds && r.completed)) {
        streak++;
      } else {
        break;
      }
    }

    return { habit, completed, rate, streak };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 期間切り替えトグル */}
      <View style={styles.toggleRow}>
        {(['week', 'month', 'year'] as Period[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.toggleBtn, period === p && styles.toggleBtnActive]}
            onPress={() => setPeriod(p)}>
            <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
              {p === 'week' ? '週' : p === 'month' ? '月' : '年'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* period をkeyにしてperiod変更時にDOMを強制再生成 */}
      <View key={`stats-${period}`}>
        {/* 全体概要カード */}
        <Text style={styles.sectionTitle}>{label}の概要</Text>
        <View style={styles.summaryRow}>
          <StatCard
            label="今日の成果"
            value={`${todayCompleted}/${activeHabits.length}`}
            color="#007AFF"
          />
          <StatCard label="達成率" value={`${overallRate}%`} color="#34C759" />
          <StatCard label="習慣数" value={`${activeHabits.length}`} color="#FF9500" />
        </View>

        {/* 全体進捗バー */}
        <View style={styles.overallCard}>
          <View style={styles.overallHeader}>
            <Text style={styles.overallTitle}>全体達成状況（{label}）</Text>
            <Text style={[styles.overallRateText, { color: '#34C759' }]}>{overallRate}%</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${overallRate}%`, backgroundColor: '#34C759' }]} />
          </View>
          <Text style={styles.overallDetail}>
            {overallCompleted} / {overallPossible} 回達成
          </Text>
        </View>

        {/* 習慣別 */}
        <Text style={styles.sectionTitle}>習慣別の達成状況</Text>
        {statsPerHabit.length === 0 && (
          <Text style={styles.empty}>習慣を追加してください</Text>
        )}
        {statsPerHabit.map(({ habit, completed, rate, streak }) => (
          <View key={habit.id} style={styles.habitCard}>
            <View style={styles.habitHeader}>
              <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={[styles.habitRateText, { color: habit.color }]}>{rate}%</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${rate}%`, backgroundColor: habit.color }]} />
            </View>
            <View style={styles.habitStats}>
              <Text style={styles.statText}>{completed} / {days} 日達成</Text>
              <Text style={styles.streakText}>🔥 連続 {streak} 日</Text>
            </View>
          </View>
        ))}
      </View>
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
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  toggleTextActive: { color: '#1C1C1E' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginTop: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4, textAlign: 'center' },
  overallCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 10, marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  overallHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overallTitle: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  overallRateText: { fontSize: 22, fontWeight: '700' },
  overallDetail: { fontSize: 12, color: '#8E8E93', textAlign: 'right' },
  empty: { color: '#8E8E93', textAlign: 'center', padding: 20 },
  habitCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 10, marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  habitHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  habitName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  habitRateText: { fontSize: 18, fontWeight: '700' },
  barBg: { height: 10, backgroundColor: '#F2F2F7', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  habitStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statText: { fontSize: 13, color: '#8E8E93' },
  streakText: { fontSize: 13, color: '#FF9500', fontWeight: '600' },
});
