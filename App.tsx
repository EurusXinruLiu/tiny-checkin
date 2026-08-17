import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ProjectEditorModal } from './src/components/ProjectEditorModal';
import { CheckInScreen } from './src/screens/CheckInScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { getLegacyDoodle } from './src/doodles';
import { COLORS } from './src/theme';
import { CheckInMap, HabitProject, PersistedState } from './src/types';
import { formatDateKey } from './src/utils/date';

const STORAGE_KEY = '@daka/state/v1';

const LEGACY_PROJECT_COLORS: Record<string, string> = {
  '#2E7D5B': '#8F5BD7',
  '#5672B7': '#D95C9A',
  '#D06F57': '#B66AD9',
  '#C08A2E': '#7E6BD6',
  '#775D9D': '#C45AA4',
  '#2D7D8C': '#E07CB1',
};

const DEFAULT_PROJECTS: HabitProject[] = [
  {
    id: 'fitness',
    name: '健身打卡',
    doodle: getLegacyDoodle('dumbbell'),
    color: '#8F5BD7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'words',
    name: '背单词',
    doodle: getLegacyDoodle('book-open-page-variant-outline'),
    color: '#D95C9A',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pilates',
    name: '普拉提',
    doodle: getLegacyDoodle('meditation'),
    color: '#B66AD9',
    createdAt: new Date().toISOString(),
  },
];

type Tab = 'checkin' | 'projects';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [projects, setProjects] = useState<HabitProject[]>(DEFAULT_PROJECTS);
  const [checkIns, setCheckIns] = useState<CheckInMap>({});
  const [selectedProjectId, setSelectedProjectId] = useState(DEFAULT_PROJECTS[0].id);
  const [activeTab, setActiveTab] = useState<Tab>('checkin');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<HabitProject | null>(null);

  useEffect(() => {
    async function hydrate() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const state = JSON.parse(stored) as PersistedState;
          if (state.projects?.length) {
            const migratedProjects = state.projects.map((project) => ({
              ...project,
              color: LEGACY_PROJECT_COLORS[project.color] ?? project.color,
              doodle:
                project.doodle?.strokes?.length > 0
                  ? project.doodle
                  : getLegacyDoodle(project.icon),
            }));
            setProjects(migratedProjects);
            setSelectedProjectId(
              migratedProjects.some((project) => project.id === state.selectedProjectId)
                ? state.selectedProjectId
                : migratedProjects[0].id,
            );
          }
          setCheckIns(state.checkIns ?? {});
        }
      } catch {
        Alert.alert('读取失败', '本地打卡数据暂时无法读取，已为你打开空白数据。');
      } finally {
        setIsReady(true);
      }
    }

    hydrate();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const state: PersistedState = { projects, checkIns, selectedProjectId };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      Alert.alert('保存失败', '本次操作未能保存到手机，请稍后重试。');
    });
  }, [checkIns, isReady, projects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId],
  );

  const toggleCheckIn = (projectId: string, date: Date) => {
    const dateKey = formatDateKey(date);
    const wasChecked = Boolean(checkIns[projectId]?.[dateKey]);

    setCheckIns((current) => ({
      ...current,
      [projectId]: {
        ...current[projectId],
        [dateKey]: !wasChecked,
      },
    }));

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        wasChecked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
      ).catch(() => undefined);
    }
  };

  const openNewProject = () => {
    setEditingProject(null);
    setEditorVisible(true);
  };

  const openEditProject = (project: HabitProject) => {
    setEditingProject(project);
    setEditorVisible(true);
  };

  const saveProject = (input: Pick<HabitProject, 'name' | 'doodle' | 'color'>) => {
    if (editingProject) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editingProject.id ? { ...project, ...input } : project,
        ),
      );
    } else {
      const project: HabitProject = {
        ...input,
        id: `habit-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setProjects((current) => [project, ...current]);
      setSelectedProjectId(project.id);
      setActiveTab('checkin');
    }
    setEditorVisible(false);
  };

  const deleteProject = (project: HabitProject) => {
    if (projects.length === 1) {
      Alert.alert('至少保留一个项目', '你可以编辑当前项目，或先新建另一个项目。');
      return;
    }

    const performDelete = () => {
      const remaining = projects.filter((item) => item.id !== project.id);
      setProjects(remaining);
      setCheckIns((current) => {
        const next = { ...current };
        delete next[project.id];
        return next;
      });
      if (selectedProjectId === project.id) {
        setSelectedProjectId(remaining[0].id);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = globalThis.confirm?.(
        `删除“${project.name}”？\n该项目的全部打卡记录也会被删除。`,
      );
      if (confirmed) performDelete();
      return;
    }

    Alert.alert('删除项目？', `“${project.name}”的全部打卡记录也会被删除。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: performDelete,
      },
    ]);
  };

  if (!isReady || !selectedProject) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={COLORS.ink} />
          <Text style={styles.loadingText}>正在打开打卡本</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          {activeTab === 'checkin' ? (
            <CheckInScreen
              projects={projects}
              selectedProject={selectedProject}
              checkIns={checkIns}
              onSelectProject={setSelectedProjectId}
              onToggleCheckIn={toggleCheckIn}
              onAddProject={openNewProject}
            />
          ) : (
            <ProjectsScreen
              projects={projects}
              checkIns={checkIns}
              onAddProject={openNewProject}
              onEditProject={openEditProject}
              onDeleteProject={deleteProject}
              onOpenProject={(project) => {
                setSelectedProjectId(project.id);
                setActiveTab('checkin');
              }}
            />
          )}
        </View>

        <View style={styles.tabBar}>
          <TabButton
            active={activeTab === 'checkin'}
            icon="calendar-check-outline"
            label="打卡"
            onPress={() => setActiveTab('checkin')}
          />
          <Pressable
            accessibilityLabel="新建打卡项目"
            accessibilityRole="button"
            onPress={openNewProject}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
          </Pressable>
          <TabButton
            active={activeTab === 'projects'}
            icon="view-grid-outline"
            label="项目"
            onPress={() => setActiveTab('projects')}
          />
        </View>
      </SafeAreaView>

      <ProjectEditorModal
        visible={editorVisible}
        project={editingProject}
        onClose={() => setEditorVisible(false)}
        onSave={saveProject}
      />
    </SafeAreaProvider>
  );
}

function TabButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={active ? COLORS.ink : COLORS.muted} />
      <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  tabBar: {
    height: 76,
    paddingHorizontal: 38,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  tabButton: {
    width: 72,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: COLORS.ink,
  },
  addButton: {
    width: 54,
    height: 54,
    marginTop: -22,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryStrong,
    ...Platform.select({
      web: { boxShadow: '0 5px 10px rgba(90, 54, 120, 0.22)' },
      default: {
        shadowColor: '#5A3678',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
