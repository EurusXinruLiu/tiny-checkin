import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { COLORS } from '../theme';
import { DoodleData, DoodlePoint, DoodleStroke } from '../types';

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function toPath(points: DoodlePoint[]) {
  if (points.length < 2) return '';

  const scaled = points.map((point) => ({ x: point.x * 100, y: point.y * 100 }));
  let path = `M ${scaled[0].x} ${scaled[0].y}`;

  for (let index = 1; index < scaled.length - 1; index += 1) {
    const current = scaled[index];
    const next = scaled[index + 1];
    const midpoint = { x: (current.x + next.x) / 2, y: (current.y + next.y) / 2 };
    path += ` Q ${current.x} ${current.y} ${midpoint.x} ${midpoint.y}`;
  }

  const last = scaled[scaled.length - 1];
  return `${path} L ${last.x} ${last.y}`;
}

export function DoodleIcon({
  doodle,
  color,
  size,
  strokeWidth = 7,
}: {
  doodle: DoodleData;
  color: string;
  size: number;
  strokeWidth?: number;
}) {
  const strokes = doodle?.strokes ?? [];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {strokes.map((item, index) =>
        item.points.length === 1 ? (
          <Circle
            key={index}
            cx={item.points[0].x * 100}
            cy={item.points[0].y * 100}
            r={strokeWidth / 2}
            fill={color}
          />
        ) : (
          <Path
            key={index}
            d={toPath(item.points)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ),
      )}
    </Svg>
  );
}

export function DoodleCanvas({
  value,
  color,
  onChange,
}: {
  value: DoodleData;
  color: string;
  onChange: (doodle: DoodleData) => void;
}) {
  const layoutRef = useRef({ width: 1, height: 1 });
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const activePointsRef = useRef<DoodlePoint[]>([]);
  const [activeStroke, setActiveStroke] = useState<DoodleStroke | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const getPoint = (event: GestureResponderEvent): DoodlePoint => ({
    x: clamp(event.nativeEvent.locationX / layoutRef.current.width),
    y: clamp(event.nativeEvent.locationY / layoutRef.current.height),
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const point = getPoint(event);
          activePointsRef.current = [point];
          setActiveStroke({ points: [point] });
        },
        onPanResponderMove: (event) => {
          if (activePointsRef.current.length >= 400) return;
          const point = getPoint(event);
          const previous = activePointsRef.current[activePointsRef.current.length - 1];
          if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.008) return;
          activePointsRef.current = [...activePointsRef.current, point];
          setActiveStroke({ points: activePointsRef.current });
        },
        onPanResponderRelease: () => {
          const points = activePointsRef.current;
          if (points.length) {
            const nextDoodle = {
              strokes: [...valueRef.current.strokes.slice(-39), { points }],
            };
            valueRef.current = nextDoodle;
            onChangeRef.current(nextDoodle);
          }
          activePointsRef.current = [];
          setActiveStroke(null);
        },
        onPanResponderTerminate: () => {
          activePointsRef.current = [];
          setActiveStroke(null);
        },
      }),
    [],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    layoutRef.current = { width: Math.max(width, 1), height: Math.max(height, 1) };
  };

  return (
    <View>
      <View
        accessibilityLabel="项目图案涂鸦画板"
        onLayout={handleLayout}
        style={styles.canvas}
        testID="doodle-canvas"
        {...panResponder.panHandlers}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          {value.strokes.map((item, index) =>
            item.points.length === 1 ? (
              <Circle
                key={index}
                cx={item.points[0].x * 100}
                cy={item.points[0].y * 100}
                r={2}
                fill={color}
              />
            ) : (
              <Path
                key={index}
                d={toPath(item.points)}
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ),
          )}
          {activeStroke &&
            (activeStroke.points.length === 1 ? (
              <Circle
                cx={activeStroke.points[0].x * 100}
                cy={activeStroke.points[0].y * 100}
                r={2}
                fill={color}
              />
            ) : (
              <Path
                d={toPath(activeStroke.points)}
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
        </Svg>
      </View>

      <View style={styles.toolbar}>
        <Pressable
          accessibilityLabel="撤销上一笔"
          accessibilityRole="button"
          disabled={!value.strokes.length}
          onPress={() => onChange({ strokes: value.strokes.slice(0, -1) })}
          style={({ pressed }) => [
            styles.toolButton,
            !value.strokes.length && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="undo-variant" size={21} color={COLORS.ink} />
        </Pressable>
        <Pressable
          accessibilityLabel="清空涂鸦"
          accessibilityRole="button"
          disabled={!value.strokes.length}
          onPress={() => onChange({ strokes: [] })}
          style={({ pressed }) => [
            styles.toolButton,
            !value.strokes.length && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="delete-sweep-outline" size={21} color={COLORS.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    height: 190,
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.surface,
  },
  toolbar: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  toolButton: {
    width: 42,
    height: 38,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  disabled: { opacity: 0.32 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.97 }] },
});
