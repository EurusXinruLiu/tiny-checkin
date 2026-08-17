import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cloneDoodle, EMPTY_DOODLE } from '../doodles';
import { COLORS } from '../theme';
import { DoodleData, HabitProject } from '../types';
import { DoodleCanvas, DoodleIcon } from './Doodle';

const SWATCHES = ['#8F5BD7', '#D95C9A', '#B66AD9', '#7E6BD6', '#C45AA4', '#E07CB1'];

type Props = {
  visible: boolean;
  project: HabitProject | null;
  onClose: () => void;
  onSave: (project: Pick<HabitProject, 'name' | 'doodle' | 'color'>) => void;
};

export function ProjectEditorModal({ visible, project, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [doodle, setDoodle] = useState<DoodleData>(EMPTY_DOODLE);
  const [color, setColor] = useState(SWATCHES[0]);

  useEffect(() => {
    if (!visible) return;
    setName(project?.name ?? '');
    setDoodle(project?.doodle ? cloneDoodle(project.doodle) : EMPTY_DOODLE);
    setColor(project?.color ?? SWATCHES[0]);
  }, [project, visible]);

  const canSave = name.trim().length > 0 && doodle.strokes.length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              hitSlop={12}
              style={styles.headerAction}
            >
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <Text style={styles.title}>{project ? '编辑项目' : '新建项目'}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!canSave}
              onPress={() => onSave({ name: name.trim(), doodle, color })}
              hitSlop={12}
              style={styles.headerAction}
            >
              <Text style={[styles.saveText, !canSave && styles.disabledText]}>保存</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View
              style={[styles.preview, { backgroundColor: color }]}
            >
              <DoodleIcon doodle={doodle} size={48} strokeWidth={7} color="#FFFFFF" />
            </View>

            <Text style={styles.label}>项目名称</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={16}
              placeholder="例如：早睡打卡"
              placeholderTextColor="#B4A6B8"
              returnKeyType="done"
              style={styles.input}
            />

            <Text style={styles.label}>绘制项目图案</Text>
            <DoodleCanvas value={doodle} color={color} onChange={setDoodle} />

            <Text style={styles.label}>选择颜色</Text>
            <View style={styles.swatchRow}>
              {SWATCHES.map((item) => (
                <Pressable
                  key={item}
                  accessibilityLabel={`选择颜色${item}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: item === color }}
                  onPress={() => setColor(item)}
                  style={[styles.swatchOuter, item === color && { borderColor: item }]}
                >
                  <View style={[styles.swatch, { backgroundColor: item }]} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  header: {
    height: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerAction: { minWidth: 48, minHeight: 40, justifyContent: 'center' },
  cancelText: { color: COLORS.muted, fontSize: 16 },
  saveText: { color: COLORS.ink, fontSize: 16, fontWeight: '700', textAlign: 'right' },
  disabledText: { opacity: 0.35 },
  title: { color: COLORS.ink, fontSize: 17, fontWeight: '700' },
  content: { padding: 24, paddingBottom: 48 },
  preview: {
    width: 76,
    height: 76,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 34,
  },
  label: { color: COLORS.ink, fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 24 },
  input: {
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    color: COLORS.ink,
    fontSize: 17,
  },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 },
  swatchOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 34, height: 34, borderRadius: 17 },
});
