import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DoodleIcon } from '../components/Doodle';
import { COLORS } from '../theme';
import { CheckInMap, HabitProject } from '../types';
import {
  addMonths,
  formatDateKey,
  formatMonthLabel,
  getCurrentStreak,
  getMonthGrid,
  getMonthStats,
  isFutureDay,
  isSameDay,
} from '../utils/date';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

type Props = {
  projects: HabitProject[];
  selectedProject: HabitProject;
  checkIns: CheckInMap;
  onSelectProject: (projectId: string) => void;
  onToggleCheckIn: (projectId: string, date: Date) => void;
  onAddProject: () => void;
};

export function CheckInScreen({
  projects,
  selectedProject,
  checkIns,
  onSelectProject,
  onToggleCheckIn,
  onAddProject,
}: Props) {
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const projectCheckIns = checkIns[selectedProject.id] ?? {};
  const monthCells = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const stats = getMonthStats(visibleMonth, projectCheckIns);
  const streak = getCurrentStreak(projectCheckIns);
  const today = new Date();
  const todayChecked = Boolean(projectCheckIns[formatDateKey(today)]);
  const viewingCurrentMonth =
    visibleMonth.getFullYear() === today.getFullYear() && visibleMonth.getMonth() === today.getMonth();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>我的打卡</Text>
          <Text style={styles.heading}>嘻嘻</Text>
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{today.getDate()}</Text>
          <Text style={styles.dateMonth}>{today.getMonth() + 1}月</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.projectRail}
      >
        {projects.map((project) => {
          const active = project.id === selectedProject.id;
          return (
            <Pressable
              key={project.id}
              onPress={() => onSelectProject(project.id)}
              style={({ pressed }) => [
                styles.projectChip,
                active && { backgroundColor: project.color, borderColor: project.color },
                pressed && styles.pressed,
              ]}
            >
              <DoodleIcon
                doodle={project.doodle}
                size={20}
                strokeWidth={8}
                color={active ? '#FFFFFF' : project.color}
              />
              <Text style={[styles.projectChipText, active && styles.projectChipTextActive]}>
                {project.name}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={onAddProject} style={styles.addChip}>
          <MaterialCommunityIcons name="plus" size={21} color={COLORS.muted} />
        </Pressable>
      </ScrollView>

      <View style={styles.monthHeader}>
        <Pressable
          accessibilityLabel="上个月"
          onPress={() => setVisibleMonth((month) => addMonths(month, -1))}
          hitSlop={10}
          style={styles.monthArrow}
        >
          <MaterialCommunityIcons name="chevron-left" size={25} color={COLORS.ink} />
        </Pressable>
        <Pressable onPress={() => setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
          <Text style={styles.monthTitle}>{formatMonthLabel(visibleMonth)}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="下个月"
          onPress={() => setVisibleMonth((month) => addMonths(month, 1))}
          hitSlop={10}
          style={styles.monthArrow}
        >
          <MaterialCommunityIcons name="chevron-right" size={25} color={COLORS.ink} />
        </Pressable>
      </View>

      <View style={styles.calendar}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((weekday) => (
            <Text key={weekday} style={styles.weekday}>
              {weekday}
            </Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {monthCells.map((date, index) => {
            if (!date) return <View key={`blank-${index}`} style={styles.dayCell} />;

            const key = formatDateKey(date);
            const checked = Boolean(projectCheckIns[key]);
            const future = isFutureDay(date);
            const current = isSameDay(date, today);
            return (
              <Pressable
                key={key}
                accessibilityLabel={`${date.getMonth() + 1}月${date.getDate()}日${checked ? '已打卡' : '未打卡'}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked, disabled: future }}
                disabled={future}
                onPress={() => onToggleCheckIn(selectedProject.id, date)}
                style={({ pressed }) => [styles.dayCell, pressed && !future && styles.pressed]}
              >
                <View
                  style={[
                    styles.dayCircle,
                    current && { borderColor: selectedProject.color },
                    checked && { backgroundColor: selectedProject.color, borderColor: selectedProject.color },
                  ]}
                >
                  {checked ? (
                    <MaterialCommunityIcons name="check" size={19} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.dayText, future && styles.futureText]}>{date.getDate()}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.statsBand}>
        <Stat value={`${stats.completed}`} label="本月完成" suffix="天" />
        <View style={styles.statDivider} />
        <Stat value={`${streak}`} label="连续打卡" suffix="天" />
        <View style={styles.statDivider} />
        <Stat value={`${stats.rate}`} label="完成率" suffix="%" />
      </View>

      {viewingCurrentMonth && (
        <Pressable
          accessibilityRole="button"
          onPress={() => onToggleCheckIn(selectedProject.id, today)}
          style={({ pressed }) => [
            styles.todayButton,
            { backgroundColor: todayChecked ? COLORS.surface : COLORS.primary },
            todayChecked && { borderColor: COLORS.primary },
            pressed && styles.pressed,
          ]}
        >
          {todayChecked ? (
            <MaterialCommunityIcons name="check-circle" size={23} color={COLORS.primary} />
          ) : (
            <DoodleIcon
              doodle={selectedProject.doodle}
              size={24}
              strokeWidth={8}
              color="#FFFFFF"
            />
          )}
          <Text
            style={[styles.todayButtonText, todayChecked && { color: COLORS.primary }]}
          >
            {todayChecked ? '今天已完成' : '完成今天打卡'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Stat({ value, label, suffix }: { value: string; label: string; suffix: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statSuffix}>{suffix}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingTop: 20, paddingBottom: 30 },
  headingRow: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { color: COLORS.muted, fontSize: 13, fontWeight: '600', marginBottom: 5 },
  heading: { color: COLORS.ink, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  dateBadge: {
    width: 53,
    height: 58,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateDay: { color: COLORS.ink, fontSize: 22, lineHeight: 24, fontWeight: '800' },
  dateMonth: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  projectRail: { paddingHorizontal: 22, gap: 10, paddingTop: 24, paddingBottom: 26 },
  projectChip: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  projectChipText: { color: COLORS.ink, fontSize: 14, fontWeight: '600' },
  projectChipTextActive: { color: '#FFFFFF' },
  addChip: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  monthHeader: {
    height: 50,
    marginHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '700' },
  monthArrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  calendar: { paddingHorizontal: 18, marginTop: 4 },
  weekRow: { flexDirection: 'row', height: 34, alignItems: 'center' },
  weekday: { width: '14.2857%', textAlign: 'center', color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { color: COLORS.ink, fontSize: 14, fontWeight: '500' },
  futureText: { color: '#C8BEC9' },
  statsBand: {
    marginTop: 22,
    marginHorizontal: 22,
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: COLORS.ink, fontSize: 22, fontWeight: '800' },
  statSuffix: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  statLabel: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
  statDivider: { width: 1, height: 34, backgroundColor: COLORS.border },
  todayButton: {
    height: 54,
    marginHorizontal: 22,
    marginTop: 18,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  todayButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
