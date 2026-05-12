import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text,
  useWindowDimensions, View,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits, type Habit } from '@/hooks/useHabits';
import { useRecords, type Record } from '@/hooks/useRecords';

type Period = 'week' | 'month' | 'year';

const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const CHART_H = 120; // 棒グラフの高さ

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRange(period: Period) {
  const now = new Date();
  const todayStr = toStr(now);
  if (period === 'week') {
    const s = new Date(now); s.setDate(now.getDate() - 6);
    return { start: toStr(s), end: todayStr, days: 7, label: '過去7日間' };
  }
  if (period === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toStr(s), end: todayStr, days: now.getDate(), label: `${now.getMonth() + 1}月` };
  }
  const s = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - s.getTime()) / 86400000) + 1;
  return { start: toStr(s), end: todayStr, days, label: `${now.getFullYear()}年` };
}

type ChartSlot = { label: string; rate: number };

// 各習慣の時間軸データを構築
function buildHabitSlots(
  period: Period,
  habit: Habit,
  records: Record[],
): ChartSlot[] {
  const doneSet = new Set(
    records.filter((r) => r.completed && r.habitId === habit.id).map((r) => r.date)
  );
  const now = new Date();

  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - 6 + i);
      const ds = toStr(d);
      return { label: WEEK_DAYS[d.getDay()], rate: doneSet.has(ds) ? 1 : 0 };
    });
  }

  if (period === 'month') {
    const year = now.getFullYear(), month = now.getMonth() + 1;
    const todayDay = now.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();
    const slots: ChartSlot[] = [];
    for (let wn = 1; wn <= 5; wn++) {
      const ws = (wn - 1) * 7 + 1;
      if (ws > daysInMonth || ws > todayDay) break;
      const we = Math.min(ws + 6, daysInMonth, todayDay);
      const daysInW = we - ws + 1;
      let cnt = 0;
      for (let d = ws; d <= we; d++) {
        const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (doneSet.has(ds)) cnt++;
      }
      slots.push({ label: `第${wn}週`, rate: daysInW > 0 ? cnt / daysInW : 0 });
    }
    return slots;
  }

  // year
  const year = now.getFullYear(), cm = now.getMonth() + 1, cd = now.getDate();
  return Array.from({ length: cm }, (_, i) => {
    const m = i + 1;
    const daysInM = new Date(year, m, 0).getDate();
    const days = m < cm ? daysInM : cd;
    let cnt = 0;
    for (let d = 1; d <= days; d++) {
      const ds = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (doneSet.has(ds)) cnt++;
    }
    return { label: MONTH_NAMES[i], rate: days > 0 ? cnt / days : 0 };
  });
}

// ── 習慣ごとの個別棒グラフ（flex ベースで幅に自動フィット）──
function HabitBarChart({ slots, color }: { slots: ChartSlot[]; color: string }) {
  if (slots.length === 0) return null;
  return (
    <View style={{ marginTop: 8 }}>
      {/* バーエリア */}
      <View style={{ flexDirection: 'row', height: CHART_H }}>
        {/* Y軸 */}
        <View style={s.yAxis}>
          <Text style={s.yLabel}>100%</Text>
          <Text style={s.yLabel}>50%</Text>
          <Text style={s.yLabel}>0%</Text>
        </View>
        {/* 棒 */}
        <View style={[s.barsArea, { height: CHART_H }]}>
          {slots.map((slot, i) => {
            const barH = Math.max(slot.rate > 0 ? 4 : 0, Math.round(slot.rate * CHART_H));
            const pct = Math.round(slot.rate * 100);
            return (
              <View key={i} style={s.barSlot}>
                {slot.rate > 0 && (
                  <Text style={[s.barPct, { color }]}>{pct}%</Text>
                )}
                <View style={[s.bar, { height: barH, backgroundColor: color, opacity: slot.rate === 0 ? 0.12 : 1 }]} />
              </View>
            );
          })}
        </View>
      </View>
      {/* X軸ラベル */}
      <View style={{ flexDirection: 'row', marginLeft: 28, marginTop: 3 }}>
        {slots.map((slot, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.xLabel}>{slot.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  yAxis: { width: 28, justifyContent: 'space-between', paddingRight: 3, borderRightWidth: 1, borderColor: '#E5E5EA' },
  yLabel: { fontSize: 8, color: '#C7C7CC', textAlign: 'right' },
  barsArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 2, borderBottomWidth: 1, borderColor: '#E5E5EA' },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_H, paddingHorizontal: 2 },
  bar: { width: '75%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barPct: { fontSize: 7, fontWeight: '700', marginBottom: 2 },
  xLabel: { fontSize: 9, color: '#8E8E93' },
});

// ── メイン画面 ──
export default function StatsScreen() {
  // すべての hook を early return より前に呼ぶ
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { width: screenW } = useWindowDimensions();

  const { habits } = useHabits(user?.uid);
  const { start, end, days, label } = useMemo(() => getRange(period), [period]);
  const { records } = useRecords(user?.uid, start, end);

  // early return（hook より後）
  if (!mounted) {
    return <View style={st.loader}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  const activeHabits = habits.filter((h) => h.isActive);
  const todayStr = toStr(new Date());

  // 全体統計
  const overallCompleted = records.filter((r) => r.completed).length;
  const overallPossible = activeHabits.length * days;
  const overallRate = overallPossible > 0 ? Math.round((overallCompleted / overallPossible) * 100) : 0;
  const todayCompleted = records.filter((r) => r.date === todayStr && r.completed).length;

  // グリッド列数・カード幅
  const GRID_PAD = 16;
  const CARD_GAP = 8;
  const cols = screenW > 900 ? 3 : screenW > 600 ? 2 : 1;
  const cardW = (screenW - GRID_PAD * 2 - CARD_GAP * (cols - 1)) / cols;

  // 習慣別統計＋スロットデータ
  const doneSet = new Set(records.filter((r) => r.completed).map((r) => `${r.habitId}_${r.date}`));
  const habitStats = activeHabits.map((habit) => {
    const completed = records.filter((r) => r.habitId === habit.id && r.completed).length;
    const rate = days > 0 ? Math.round((completed / days) * 100) : 0;
    let streak = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (doneSet.has(`${habit.id}_${toStr(d)}`)) streak++;
      else break;
    }
    const slots = buildHabitSlots(period, habit, records);
    return { habit, completed, rate, streak, slots };
  });

  const chartLabel = period === 'week' ? '日ごと' : period === 'month' ? '週ごと' : '月ごと';

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* 期間トグル */}
      <View style={st.toggleRow}>
        {(['week', 'month', 'year'] as Period[]).map((p) => (
          <Pressable key={p} style={[st.toggleBtn, period === p && st.toggleBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[st.toggleText, period === p && st.toggleTextActive]}>
              {p === 'week' ? '週' : p === 'month' ? '月' : '年'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View key={`body-${period}`}>
        {/* 概要カード */}
        <Text style={st.sectionTitle}>{label}の概要</Text>
        <View style={st.summaryRow}>
          <StatCard label="今日の成果" value={`${todayCompleted}/${activeHabits.length}`} color="#007AFF" />
          <StatCard label="達成率" value={`${overallRate}%`} color="#34C759" />
          <StatCard label="習慣数" value={`${activeHabits.length}`} color="#FF9500" />
        </View>

        {/* 習慣別グリッド */}
        <Text style={st.sectionTitle}>習慣別の達成状況（{chartLabel}）</Text>
        {habitStats.length === 0 && <Text style={st.empty}>習慣を追加してください</Text>}

        <View style={[st.grid, { gap: CARD_GAP }]}>
          {habitStats.map(({ habit, completed, rate, streak, slots }) => (
            <View key={habit.id} style={[st.habitCard, { width: cardW }]}>
              {/* ヘッダー */}
              <View style={st.cardHeader}>
                <View style={[st.colorDot, { backgroundColor: habit.color }]} />
                <Text style={st.habitName} numberOfLines={1}>{habit.name}</Text>
                <Text style={[st.rateNum, { color: habit.color }]}>{rate}%</Text>
              </View>

              {/* 個別棒グラフ（カード幅に自動フィット）*/}
              <HabitBarChart slots={slots} color={habit.color} />

              {/* サマリー */}
              <View style={st.cardFooter}>
                <Text style={st.footerText}>{completed}/{days}日達成</Text>
                <Text style={st.streakText}>🔥 連続{streak}日</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={st.statCard}>
      <Text style={[st.statValue, { color }]}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 10, padding: 3, gap: 3 },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  toggleTextActive: { color: '#1C1C1E' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginTop: 8 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  habitCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  habitName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  rateNum: { fontSize: 18, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  footerText: { fontSize: 11, color: '#8E8E93' },
  streakText: { fontSize: 11, color: '#FF9500', fontWeight: '600' },
  empty: { color: '#8E8E93', textAlign: 'center', padding: 20 },
});
