import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits, type Habit } from '@/hooks/useHabits';
import { useRecords, type Record } from '@/hooks/useRecords';

type Period = 'week' | 'month' | 'year';

// ---- 定数 ----
const CHART_H = 140;   // バーエリアの高さ(px)
const BAR_W = 12;      // 1本のバーの幅
const BAR_GAP = 2;     // バー間隔
const GROUP_MARGIN = 10; // グループ間の余白

const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// ---- ユーティリティ ----
function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRange(period: Period) {
  const now = new Date();
  const todayStr = toStr(now);
  if (period === 'week') {
    const s = new Date(now);
    s.setDate(now.getDate() - 6);
    return { start: toStr(s), end: todayStr, days: 7, label: '過去7日間' };
  }
  if (period === 'month') {
    const days = now.getDate();
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toStr(s), end: todayStr, days, label: `${now.getMonth() + 1}月` };
  }
  const s = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - s.getTime()) / 86400000) + 1;
  return { start: toStr(s), end: todayStr, days, label: `${now.getFullYear()}年` };
}

// ---- グラフデータ型 ----
type ChartGroup = {
  label: string;
  rates: number[]; // 各習慣の達成率 0.0〜1.0
};

function buildChartGroups(
  period: Period,
  activeHabits: Habit[],
  records: Record[],
): ChartGroup[] {
  if (activeHabits.length === 0) return [];

  // O(1)参照のためセットを作成
  const doneSet = new Set(
    records.filter((r) => r.completed).map((r) => `${r.habitId}_${r.date}`)
  );
  const isDone = (habitId: string, dateStr: string) => doneSet.has(`${habitId}_${dateStr}`);

  const now = new Date();

  // 週タブ → 日ごと(過去7日)
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - 6 + i);
      const ds = toStr(d);
      return {
        label: WEEK_DAYS[d.getDay()],
        rates: activeHabits.map((h) => (isDone(h.id, ds) ? 1 : 0)),
      };
    });
  }

  // 月タブ → 週ごと(今月)
  if (period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const todayDay = now.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();
    const groups: ChartGroup[] = [];

    for (let wn = 1; wn <= 5; wn++) {
      const ws = (wn - 1) * 7 + 1;
      if (ws > daysInMonth || ws > todayDay) break;
      const we = Math.min(ws + 6, daysInMonth, todayDay);
      const daysInW = we - ws + 1;
      groups.push({
        label: `第${wn}週`,
        rates: activeHabits.map((h) => {
          let cnt = 0;
          for (let d = ws; d <= we; d++) {
            const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (isDone(h.id, ds)) cnt++;
          }
          return daysInW > 0 ? cnt / daysInW : 0;
        }),
      });
    }
    return groups;
  }

  // 年タブ → 月ごと(今年)
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  return Array.from({ length: currentMonth }, (_, i) => {
    const m = i + 1;
    const daysInM = new Date(year, m, 0).getDate();
    const days = m < currentMonth ? daysInM : todayDay;
    return {
      label: MONTH_NAMES[i],
      rates: activeHabits.map((h) => {
        let cnt = 0;
        for (let d = 1; d <= days; d++) {
          const ds = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (isDone(h.id, ds)) cnt++;
        }
        return days > 0 ? cnt / days : 0;
      }),
    };
  });
}

// ---- グループ棒グラフ ----
function GroupedBarChart({
  groups,
  colors,
  habitNames,
}: {
  groups: ChartGroup[];
  colors: string[];
  habitNames: string[];
}) {
  if (groups.length === 0 || colors.length === 0) {
    return <Text style={cStyles.noData}>データなし</Text>;
  }

  const groupW = colors.length * (BAR_W + BAR_GAP) - BAR_GAP + GROUP_MARGIN * 2;

  return (
    <View>
      {/* グラフ本体 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {/* Y軸 */}
          <View style={cStyles.yAxis}>
            <Text style={cStyles.yLabel}>100%</Text>
            <Text style={cStyles.yLabel}>50%</Text>
            <Text style={cStyles.yLabel}>0%</Text>
          </View>

          {/* バー＋X軸ラベル */}
          <View>
            {/* バーエリア */}
            <View style={[cStyles.barsRow, { height: CHART_H }]}>
              {groups.map((group, gi) => (
                <View key={gi} style={{ width: groupW, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H, paddingHorizontal: GROUP_MARGIN / 2 }}>
                    {group.rates.map((rate, hi) => (
                      <View
                        key={hi}
                        style={{
                          width: BAR_W,
                          height: Math.max(rate > 0 ? 4 : 0, Math.round(rate * CHART_H)),
                          backgroundColor: colors[hi],
                          marginHorizontal: BAR_GAP / 2,
                          borderTopLeftRadius: 3,
                          borderTopRightRadius: 3,
                          opacity: rate === 0 ? 0.15 : 1,
                        }}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
            {/* X軸ラベル */}
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#E5E5EA' }}>
              {groups.map((group, gi) => (
                <View key={gi} style={{ width: groupW, alignItems: 'center', paddingTop: 4 }}>
                  <Text style={cStyles.xLabel}>{group.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 凡例 */}
      <View style={cStyles.legend}>
        {habitNames.map((name, i) => (
          <View key={i} style={cStyles.legendItem}>
            <View style={[cStyles.legendColor, { backgroundColor: colors[i] }]} />
            <Text style={cStyles.legendText}>{name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const cStyles = StyleSheet.create({
  noData: { color: '#8E8E93', textAlign: 'center', padding: 20 },
  yAxis: { width: 34, height: CHART_H, justifyContent: 'space-between', paddingRight: 6, paddingVertical: 0, borderRightWidth: 1, borderColor: '#E5E5EA' },
  yLabel: { fontSize: 9, color: '#C7C7CC', textAlign: 'right' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end' },
  xLabel: { fontSize: 10, color: '#8E8E93' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendColor: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 12, color: '#8E8E93' },
});

// ---- メイン画面 ----
export default function StatsScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { habits } = useHabits(user?.uid);
  const { start, end, days, label } = useMemo(() => getRange(period), [period]);
  const { records } = useRecords(user?.uid, start, end);

  if (!mounted) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  const activeHabits = habits.filter((h) => h.isActive);
  const todayStr = toStr(new Date());

  const overallCompleted = records.filter((r) => r.completed).length;
  const overallPossible = activeHabits.length * days;
  const overallRate = overallPossible > 0 ? Math.round((overallCompleted / overallPossible) * 100) : 0;
  const todayCompleted = records.filter((r) => r.date === todayStr && r.completed).length;

  const chartGroups = useMemo(
    () => buildChartGroups(period, activeHabits, records),
    [period, activeHabits, records]
  );

  const doneSet = new Set(records.filter((r) => r.completed).map((r) => `${r.habitId}_${r.date}`));
  const statsPerHabit = activeHabits.map((habit) => {
    const completed = records.filter((r) => r.habitId === habit.id && r.completed).length;
    const rate = days > 0 ? Math.round((completed / days) * 100) : 0;
    let streak = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (doneSet.has(`${habit.id}_${toStr(d)}`)) streak++;
      else break;
    }
    return { habit, completed, rate, streak };
  });

  const colors = activeHabits.map((h) => h.color);
  const habitNames = activeHabits.map((h) => h.name);

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

      <View key={`body-${period}`}>
        {/* 概要カード */}
        <Text style={styles.sectionTitle}>{label}の概要</Text>
        <View style={styles.summaryRow}>
          <StatCard label="今日の成果" value={`${todayCompleted}/${activeHabits.length}`} color="#007AFF" />
          <StatCard label="達成率" value={`${overallRate}%`} color="#34C759" />
          <StatCard label="習慣数" value={`${activeHabits.length}`} color="#FF9500" />
        </View>

        {/* グループ棒グラフ */}
        <Text style={styles.sectionTitle}>
          {period === 'week' ? '日ごとの達成状況' : period === 'month' ? '週ごとの達成状況' : '月ごとの達成状況'}
        </Text>
        <View style={styles.card}>
          <GroupedBarChart groups={chartGroups} colors={colors} habitNames={habitNames} />
        </View>

        {/* 習慣別サマリー */}
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
    flexDirection: 'row', backgroundColor: '#E5E5EA',
    borderRadius: 10, padding: 3, gap: 3,
  },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  toggleTextActive: { color: '#1C1C1E' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginTop: 8 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  empty: { color: '#8E8E93', textAlign: 'center', padding: 20 },
  habitCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  habitHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  habitName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  habitRateText: { fontSize: 18, fontWeight: '700' },
  barBg: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  habitStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statText: { fontSize: 13, color: '#8E8E93' },
  streakText: { fontSize: 13, color: '#FF9500', fontWeight: '600' },
});
