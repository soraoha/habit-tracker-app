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
    // 当日から30日前まで
    const s = new Date(now); s.setDate(now.getDate() - 29);
    return { start: toStr(s), end: todayStr, days: 30, label: '過去30日間' };
  }
  // 当日から365日前まで
  const s = new Date(now); s.setDate(now.getDate() - 364);
  return { start: toStr(s), end: todayStr, days: 365, label: '過去1年間' };
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

  // ── 週：過去7日間を日ごとに表示 ──
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - 6 + i);
      const ds = toStr(d);
      return { label: WEEK_DAYS[d.getDay()], rate: doneSet.has(ds) ? 1 : 0 };
    });
  }

  // ── 月：過去30日間を週ごとに集計（W1=最古週〜W5=今週）──
  if (period === 'month') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start30 = new Date(today); start30.setDate(today.getDate() - 29);
    const MLABELS = ['4週前', '3週前', '2週前', '先週', '今週'];
    const slots: ChartSlot[] = [];

    for (let wn = 0; wn < 5; wn++) {
      const weekStart = new Date(start30); weekStart.setDate(start30.getDate() + wn * 7);
      if (weekStart > today) break;
      let cnt = 0, dCnt = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart); date.setDate(weekStart.getDate() + d);
        if (date > today) break;
        dCnt++;
        if (doneSet.has(toStr(date))) cnt++;
      }
      slots.push({ label: MLABELS[wn], rate: dCnt > 0 ? cnt / dCnt : 0 });
    }
    return slots;
  }

  // ── 年：過去12ヶ月を月ごとに集計 ──
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yearStart = new Date(today); yearStart.setDate(today.getDate() - 364);
  const slots: ChartSlot[] = [];

  for (let i = 11; i >= 0; i--) {
    const target = new Date(today); target.setMonth(today.getMonth() - i);
    const yr = target.getFullYear();
    const mo = target.getMonth() + 1;

    const monthFirst = new Date(yr, mo - 1, 1);
    const monthLast  = new Date(yr, mo, 0);
    const rangeStart = monthFirst < yearStart ? yearStart : monthFirst;
    const rangeEnd   = monthLast  > today     ? today     : monthLast;

    const totalDays = Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1;
    let cnt = 0;
    for (let d = 0; d < totalDays; d++) {
      const date = new Date(rangeStart); date.setDate(rangeStart.getDate() + d);
      if (doneSet.has(toStr(date))) cnt++;
    }
    slots.push({ label: `${mo}月`, rate: totalDays > 0 ? cnt / totalDays : 0 });
  }
  return slots;
}

// ── 習慣ごとの個別棒グラフ（flex ベースで幅に自動フィット）──
function HabitBarChart({ slots, color, chartH = CHART_H }: { slots: ChartSlot[]; color: string; chartH?: number }) {
  if (slots.length === 0) return null;
  return (
    <View style={{ marginTop: 8, flex: 1 }}>
      {/* バーエリア */}
      <View style={{ flexDirection: 'row', height: chartH, flex: 1 }}>
        {/* Y軸 */}
        <View style={[s.yAxis, { height: chartH }]}>
          <Text style={s.yLabel}>100%</Text>
          <Text style={s.yLabel}>50%</Text>
          <Text style={s.yLabel}>0%</Text>
        </View>
        {/* 棒 */}
        <View style={[s.barsArea, { height: chartH }]}>
          {slots.map((slot, i) => {
            const barH = Math.max(slot.rate > 0 ? 4 : 0, Math.round(slot.rate * chartH));
            const pct = Math.round(slot.rate * 100);
            return (
              <View key={`bar-${slot.label}-${i}`} style={[s.barSlot, { height: chartH }]}>
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
          <View key={`lbl-${slot.label}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
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
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 2 },
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
  const cols = screenW > 520 ? 3 : 1;
  // スクロールバー分(~20px)を除いた実効幅でカード幅を計算（全体グラフ・chartH算出用）
  const safeW = screenW - 20;
  const cardW = Math.floor((safeW - GRID_PAD * 2 - CARD_GAP * (cols - 1)) / cols);
  // padding(24) + header(22) + chart margin(8) + x-axis(18) + footer(25) ≈ 97px
  const habitChartH = Math.max(60, cardW - 97);

  // habitStats を cols 列の行に分割（flex:1 レイアウト用）
  const habitRows: (typeof habitStats)[] = [];
  for (let i = 0; i < habitStats.length; i += cols) {
    habitRows.push(habitStats.slice(i, i + cols));
  }

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

  // 全習慣を集計した全体スロット
  const overallSlots: ChartSlot[] = habitStats.length > 0
    ? habitStats[0].slots.map((slot, i) => ({
        label: slot.label,
        rate: habitStats.reduce((sum, hs) => sum + (hs.slots[i]?.rate ?? 0), 0) / habitStats.length,
      }))
    : [];

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

        {/* 全体グラフ：習慣カードと同サイズの正方形・水平中央 */}
        {overallSlots.length > 0 && (
          <>
            <Text style={st.sectionTitle}>全体の達成状況（{chartLabel}）</Text>
            <View style={[st.habitCard, { width: cardW, height: cardW, alignSelf: 'center', borderWidth: 2, borderColor: '#007AFF' }]}>
              <View style={st.cardHeader}>
                <View style={[st.colorDot, { backgroundColor: '#007AFF' }]} />
                <Text style={st.habitName}>全習慣の平均</Text>
                <Text style={[st.rateNum, { color: '#007AFF' }]}>{overallRate}%</Text>
              </View>
              <HabitBarChart key={`overall-${period}`} slots={overallSlots} color="#007AFF" chartH={habitChartH} />
              <View style={st.cardFooter}>
                <Text style={st.footerText}>{overallCompleted}/{overallPossible}回達成</Text>
              </View>
            </View>
          </>
        )}

        {/* 習慣別グリッド */}
        <Text style={st.sectionTitle}>習慣別の達成状況（{chartLabel}）</Text>
        {habitStats.length === 0 && <Text style={st.empty}>習慣を追加してください</Text>}

        {/* 行ごとに flex:1 カードを並べる（右端の空き解消・3列確定）*/}
        <View style={{ gap: CARD_GAP }}>
          {habitRows.map((row, rowIdx) => (
            <View key={`row-${rowIdx}`} style={{ flexDirection: 'row', gap: CARD_GAP }}>
              {row.map(({ habit, completed, rate, streak, slots }) => (
                <View key={habit.id} style={[st.habitCard, { flex: 1, aspectRatio: 1 }]}>
                  <View style={st.cardHeader}>
                    <View style={[st.colorDot, { backgroundColor: habit.color }]} />
                    <Text style={st.habitName} numberOfLines={1}>{habit.name}</Text>
                    <Text style={[st.rateNum, { color: habit.color }]}>{rate}%</Text>
                  </View>
                  <HabitBarChart key={period} slots={slots} color={habit.color} chartH={habitChartH} />
                  <View style={st.cardFooter}>
                    <Text style={st.footerText}>{completed}/{days}日達成</Text>
                    <Text style={st.streakText}>🔥 連続{streak}日</Text>
                  </View>
                </View>
              ))}
              {/* 最終行が cols に満たない場合は空 flex:1 で穴埋め */}
              {Array.from({ length: cols - row.length }, (_, j) => (
                <View key={`pad-${j}`} style={{ flex: 1 }} />
              ))}
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
  habitCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  habitName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  rateNum: { fontSize: 18, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  footerText: { fontSize: 11, color: '#8E8E93' },
  streakText: { fontSize: 11, color: '#FF9500', fontWeight: '600' },
  empty: { color: '#8E8E93', textAlign: 'center', padding: 20 },
});
