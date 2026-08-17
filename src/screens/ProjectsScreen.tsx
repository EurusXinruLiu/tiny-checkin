import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DoodleIcon } from '../components/Doodle';
import { COLORS } from '../theme';
import { CheckInMap, HabitProject } from '../types';
import { getCurrentStreak, getMonthStats } from '../utils/date';

type Props = {
  projects: HabitProject[];
  checkIns: CheckInMap;
  onAddProject: () => void;
  onEditProject: (project: HabitProject) => void;
  onDeleteProject: (project: HabitProject) => void;
  onOpenProject: (project: HabitProject) => void;
};

export function ProjectsScreen({
  projects,
  checkIns,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onOpenProject,
}: Props) {
  const now = new Date();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>习惯清单</Text>
          <Text style={styles.heading}>我的项目</Text>
        </View>
        <Pressable
          accessibilityLabel="新建项目"
          accessibilityRole="button"
          onPress={onAddProject}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="plus" size={22} color={COLORS.ink} />
        </Pressable>
      </View>

      <Text style={styles.summary}>正在坚持 {projects.length} 个项目</Text>

      <View style={styles.list}>
        {projects.map((project) => {
          const records = checkIns[project.id] ?? {};
          const monthStats = getMonthStats(now, records);
          const total = Object.values(records).filter(Boolean).length;
          const streak = getCurrentStreak(records);

          return (
            <View key={project.id} style={styles.projectRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpenProject(project)}
                style={({ pressed }) => [styles.projectMain, pressed && styles.pressed]}
              >
                <View
                  style={[styles.projectIcon, { backgroundColor: project.color }]}
                >
                  <DoodleIcon doodle={project.doodle} size={34} strokeWidth={7} color="#FFFFFF" />
                </View>
                <View style={styles.projectText}>
                  <Text style={styles.projectName} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={styles.projectMeta}>
                    本月 {monthStats.completed} 天 · 连续 {streak} 天 · 累计 {total} 天
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#B2A5B5" />
              </Pressable>

              <View style={styles.actions}>
                <Pressable
                  accessibilityLabel={`编辑${project.name}`}
                  accessibilityRole="button"
                  onPress={() => onEditProject(project)}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={19} color={COLORS.muted} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`删除${project.name}`}
                  accessibilityRole="button"
                  onPress={() => onDeleteProject(project)}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={19} color={COLORS.danger} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onAddProject}
        style={({ pressed }) => [styles.newProjectButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="plus-circle-outline" size={22} color={COLORS.ink} />
        <Text style={styles.newProjectText}>新建打卡项目</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 22, paddingTop: 20, paddingBottom: 38 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: COLORS.muted, fontSize: 13, fontWeight: '600', marginBottom: 5 },
  heading: { color: COLORS.ink, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summary: { color: COLORS.muted, fontSize: 14, marginTop: 22, marginBottom: 10 },
  list: { borderTopWidth: 1, borderTopColor: COLORS.border },
  projectRow: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  projectMain: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  projectIcon: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectText: { flex: 1, minWidth: 0, paddingHorizontal: 14 },
  projectName: { color: COLORS.ink, fontSize: 17, fontWeight: '700' },
  projectMeta: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  actionButton: {
    width: 38,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  newProjectButton: {
    height: 54,
    marginTop: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BFAEC4',
  },
  newProjectText: { color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
});
