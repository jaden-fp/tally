import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as LucideIcons from 'lucide-react-native';
import { useHabitStore } from '../store/habitStore';
import { HabitForm } from './HabitForm';
import type { Habit } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HabitWidgetProps {
  habit: Habit;
  todayCount: number;
  lastTrackedDaysAgo: number | null;
}

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>;

function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return LucideIcons.Circle as LucideIcon;
  // Icon names in lucide-react-native are PascalCase
  const key = name
    .split(/[-_\s]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('') as keyof typeof LucideIcons;
  return (LucideIcons[key] as LucideIcon | undefined) ?? (LucideIcons.Circle as LucideIcon);
}

// ---------------------------------------------------------------------------
// Footer text
// ---------------------------------------------------------------------------

function footerText(lastTrackedDaysAgo: number | null): string {
  if (lastTrackedDaysAgo === null) return 'never tracked';
  if (lastTrackedDaysAgo === 0) return 'tracked today';
  if (lastTrackedDaysAgo === 1) return 'last tracked yesterday';
  return `last tracked ${lastTrackedDaysAgo} days ago`;
}

// ---------------------------------------------------------------------------
// HabitWidget
// ---------------------------------------------------------------------------

const HabitWidget = memo(function HabitWidget({
  habit,
  todayCount,
  lastTrackedDaysAgo,
}: HabitWidgetProps) {
  const { increment, decrement, removeHabit, editHabit } = useHabitStore();
  const router = useRouter();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const Icon = resolveIcon(habit.icon);
  const color = habit.color ?? '#6366f1';

  // Reanimated scale for press feedback
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Count number flash when value changes
  const countOpacity = useSharedValue(1);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    countOpacity.value = withSequence(
      withTiming(0.5, { duration: 60 }),
      withTiming(1.0, { duration: 140 }),
    );
  }, [todayCount, countOpacity]);
  const countAnimatedStyle = useAnimatedStyle(() => ({ opacity: countOpacity.value }));

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(1.0, { duration: 100 }),
    );
    increment(habit.id);
  }, [habit.id, increment, scale]);

  const handleLongPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetVisible(true);
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete habit',
      `Are you sure you want to delete "${habit.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSheetVisible(false);
            removeHabit(habit.id);
          },
        },
      ],
    );
  }, [habit.id, habit.name, removeHabit]);

  return (
    <>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={400}
          className="bg-white rounded-2xl p-4 shadow-sm overflow-hidden"
          style={{ borderLeftWidth: 4, borderLeftColor: color }}
        >
          {/* Icon */}
          <Icon size={24} color={color} />

          {/* Name */}
          <Text
            className="mt-2 text-sm font-semibold"
            style={{ color: '#1a1a1a', fontSize: 14 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {habit.name}
          </Text>

          {/* Count */}
          <Animated.Text
            className="mt-3 font-bold"
            style={[{ fontSize: 32, color, lineHeight: 38 }, countAnimatedStyle]}
          >
            {todayCount}
          </Animated.Text>

          {/* "today" label */}
          <Text
            className="font-normal"
            style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}
          >
            today
          </Text>

          {/* Footer */}
          <Text
            className="mt-3 font-normal"
            style={{ fontSize: 11, color: '#d1d5db' }}
          >
            {footerText(lastTrackedDaysAgo)}
          </Text>
        </Pressable>
      </Animated.View>

      {/* Bottom sheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        habit={habit}
        todayCount={todayCount}
        color={color}
        onDelete={handleDelete}
        onIncrement={() => increment(habit.id)}
        onDecrement={() => decrement(habit.id)}
        onEdit={() => { setSheetVisible(false); setEditVisible(true); }}
        onViewDetail={() => { setSheetVisible(false); router.push(`/habit/${habit.id}`); }}
      />

      {/* Edit habit form */}
      <HabitForm
        visible={editVisible}
        mode="edit"
        initialValues={habit}
        onSubmit={(data) => editHabit(habit.id, data)}
        onDelete={() => { setEditVisible(false); removeHabit(habit.id); }}
        onClose={() => setEditVisible(false)}
      />
    </>
  );
});

export default HabitWidget;

// ---------------------------------------------------------------------------
// BottomSheet
// ---------------------------------------------------------------------------

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  habit: Habit;
  todayCount: number;
  color: string;
  onDelete: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onEdit: () => void;
  onViewDetail: () => void;
}

const BottomSheet = memo(function BottomSheet({
  visible,
  onClose,
  habit,
  todayCount,
  color,
  onDelete,
  onIncrement,
  onDecrement,
  onEdit,
  onViewDetail,
}: BottomSheetProps) {
  const Icon = resolveIcon(habit.icon);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
      />

      {/* Sheet panel */}
      <View className="bg-white rounded-t-3xl px-6 pt-5 pb-10">
        {/* Drag handle */}
        <View className="self-center w-10 h-1 rounded-full bg-gray-200 mb-5" />

        {/* Habit header */}
        <View className="flex-row items-center gap-x-3 mb-6">
          <Icon size={28} color={color} />
          <Text className="text-lg font-semibold text-gray-900">
            {habit.name}
          </Text>
        </View>

        {/* Count adjuster */}
        <View className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-5 py-4 mb-4">
          <TouchableOpacity
            onPress={onDecrement}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center shadow-sm"
            activeOpacity={0.7}
          >
            <LucideIcons.Minus size={18} color="#374151" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-4xl font-bold" style={{ color }}>
              {todayCount}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">today</Text>
          </View>

          <TouchableOpacity
            onPress={onIncrement}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center shadow-sm"
            activeOpacity={0.7}
          >
            <LucideIcons.Plus size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* View detail / Edit buttons */}
        <View className="flex-row gap-x-2 mb-3">
          <TouchableOpacity
            onPress={onViewDetail}
            className="flex-1 flex-row items-center justify-center gap-x-2 py-3.5 rounded-2xl border border-gray-200"
            activeOpacity={0.7}
          >
            <LucideIcons.BarChart3 size={16} color="#374151" />
            <Text className="text-sm font-medium text-gray-700">Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onEdit}
            className="flex-1 flex-row items-center justify-center gap-x-2 py-3.5 rounded-2xl border border-gray-200"
            activeOpacity={0.7}
          >
            <LucideIcons.Pencil size={16} color="#374151" />
            <Text className="text-sm font-medium text-gray-700">Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={onDelete}
          className="flex-row items-center justify-center gap-x-2 py-3.5 rounded-2xl bg-red-50"
          activeOpacity={0.7}
        >
          <LucideIcons.Trash2 size={16} color="#ef4444" />
          <Text className="text-sm font-medium text-red-500">Delete</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
});
