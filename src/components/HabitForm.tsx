import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { HABIT_ICONS, DEFAULT_ICON } from '../constants/icons';
import { PRESET_COLORS, DEFAULT_COLOR } from '../constants/colors';
import type { GoalFrequency, Habit, NewHabit } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HabitFormProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initialValues?: Habit;
  onSubmit: (data: NewHabit) => void;
  onDelete?: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>;

function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return LucideIcons.Circle as LucideIcon;
  const key = name
    .split(/[-_\s]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('') as keyof typeof LucideIcons;
  return (LucideIcons[key] as LucideIcon | undefined) ?? (LucideIcons.Circle as LucideIcon);
}

const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Yearly'] as const;
type Frequency = (typeof FREQUENCY_OPTIONS)[number];

const FREQUENCY_MAP: Record<Frequency, GoalFrequency> = {
  Daily: 'daily',
  Weekly: 'weekly',
  Yearly: 'yearly',
};

const FREQUENCY_LABEL: Record<Frequency, string> = {
  Daily: 'per day',
  Weekly: 'per week',
  Yearly: 'per year',
};

// ---------------------------------------------------------------------------
// HabitForm
// ---------------------------------------------------------------------------

export const HabitForm = memo(function HabitForm({
  visible,
  mode,
  initialValues,
  onSubmit,
  onDelete,
  onClose,
}: HabitFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [selectedIcon, setSelectedIcon] = useState(initialValues?.icon ?? DEFAULT_ICON);
  const [selectedColor, setSelectedColor] = useState(initialValues?.color ?? DEFAULT_COLOR);
  const [goalEnabled, setGoalEnabled] = useState(initialValues?.goalEnabled ?? false);
  const [frequency, setFrequency] = useState<Frequency>(() => {
    if (initialValues?.goalFrequency === 'weekly') return 'Weekly';
    if (initialValues?.goalFrequency === 'yearly') return 'Yearly';
    return 'Daily';
  });
  const [target, setTarget] = useState(String(initialValues?.goalTarget ?? 1));
  const nameRef = useRef<TextInput>(null);

  // Sync form fields when the modal opens (handles re-opening with different habits)
  useEffect(() => {
    if (visible) {
      setName(initialValues?.name ?? '');
      setSelectedIcon(initialValues?.icon ?? DEFAULT_ICON);
      setSelectedColor(initialValues?.color ?? DEFAULT_COLOR);
      setGoalEnabled(initialValues?.goalEnabled ?? false);
      setTarget(String(initialValues?.goalTarget ?? 1));
      if (initialValues?.goalFrequency === 'weekly') setFrequency('Weekly');
      else if (initialValues?.goalFrequency === 'yearly') setFrequency('Yearly');
      else setFrequency('Daily');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a habit name.');
      nameRef.current?.focus();
      return;
    }
    onSubmit({
      name: trimmed,
      icon: selectedIcon,
      color: selectedColor,
      goalEnabled,
      goalFrequency: goalEnabled ? FREQUENCY_MAP[frequency] : undefined,
      goalTarget: goalEnabled ? parseInt(target, 10) || 1 : undefined,
      userId: initialValues?.userId ?? '',
      order: initialValues?.order,
    });
    onClose();
  }, [name, selectedIcon, selectedColor, goalEnabled, target, onSubmit, onClose, initialValues]);

  const handleDelete = useCallback(() => {
    const label = name.trim() || 'this habit';
    Alert.alert(
      'Delete Habit',
      `Delete "${label}"? This will permanently delete all tracking data for this habit and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDelete?.();
          },
        },
      ],
    );
  }, [name, onClose, onDelete]);

  const isEdit = mode === 'edit';
  const Icon = resolveIcon(selectedIcon);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text className="text-base text-gray-500">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit Habit' : 'New Habit'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.7}>
            <Text className="text-base font-semibold" style={{ color: selectedColor }}>
              {isEdit ? 'Save' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon preview */}
          <View className="items-center mb-6">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: `${selectedColor}22` }}
            >
              <Icon size={32} color={selectedColor} />
            </View>
          </View>

          {/* Name */}
          <FormSection label="Habit name">
            <TextInput
              ref={nameRef}
              value={name}
              onChangeText={(t) => setName(t.slice(0, 30))}
              placeholder="e.g. Read, Meditate, Drink water"
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-sm text-gray-900"
              returnKeyType="done"
              maxLength={30}
            />
            <Text className="text-xs text-gray-300 text-right mt-1">
              {name.length}/30
            </Text>
          </FormSection>

          {/* Icon picker */}
          <FormSection label="Icon">
            <View className="flex-row flex-wrap gap-2">
              {HABIT_ICONS.map((iconName) => {
                const IconComp = resolveIcon(iconName);
                const active = iconName === selectedIcon;
                return (
                  <Pressable
                    key={iconName}
                    onPress={() => setSelectedIcon(iconName)}
                    className="w-11 h-11 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor: active ? `${selectedColor}22` : '#f9fafb',
                      borderWidth: active ? 1.5 : 0,
                      borderColor: active ? selectedColor : 'transparent',
                    }}
                  >
                    <IconComp size={20} color={active ? selectedColor : '#6b7280'} />
                  </Pressable>
                );
              })}
            </View>
          </FormSection>

          {/* Color picker */}
          <FormSection label="Color">
            <View className="flex-row flex-wrap gap-2.5">
              {PRESET_COLORS.map(({ value }) => {
                const active = value === selectedColor;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setSelectedColor(value)}
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: value,
                      borderWidth: active ? 2.5 : 0,
                      borderColor: active ? value : 'transparent',
                      opacity: active ? 1 : 0.85,
                      transform: [{ scale: active ? 1.1 : 1 }],
                    }}
                  >
                    {active && (
                      <LucideIcons.Check size={14} color="#fff" strokeWidth={3} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </FormSection>

          {/* Goal */}
          <FormSection label="Goal">
            <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <Text className="text-sm text-gray-700">Set a daily goal</Text>
              <Switch
                value={goalEnabled}
                onValueChange={setGoalEnabled}
                trackColor={{ false: '#e5e7eb', true: selectedColor }}
                thumbColor="#fff"
              />
            </View>

            {goalEnabled && (
              <View className="mt-3 gap-y-3">
                {/* Frequency segmented control */}
                <View className="flex-row bg-gray-100 rounded-xl p-1">
                  {FREQUENCY_OPTIONS.map((option) => {
                    const active = option === frequency;
                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setFrequency(option)}
                        className="flex-1 py-2 rounded-lg items-center"
                        style={{ backgroundColor: active ? '#fff' : 'transparent' }}
                        activeOpacity={0.7}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{ color: active ? '#111827' : '#6b7280' }}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Target count */}
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                  <Text className="flex-1 text-sm text-gray-700">
                    Target ({FREQUENCY_LABEL[frequency]})
                  </Text>
                  <TextInput
                    value={target}
                    onChangeText={(t) => setTarget(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    className="text-sm font-semibold text-right"
                    style={{ color: selectedColor, minWidth: 32 }}
                    maxLength={3}
                  />
                </View>
              </View>
            )}
          </FormSection>
        </ScrollView>

        {/* Footer */}
        <View className="px-5 pb-8 pt-3 gap-y-2.5 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSubmit}
            className="py-4 rounded-2xl items-center"
            style={{ backgroundColor: selectedColor }}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">
              {isEdit ? 'Save Changes' : 'Create Habit'}
            </Text>
          </TouchableOpacity>

          {isEdit && onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              className="flex-row items-center justify-center gap-x-2 py-3 rounded-2xl bg-red-50"
              activeOpacity={0.7}
            >
              <LucideIcons.Trash2 size={15} color="#ef4444" />
              <Text className="text-red-500 text-sm font-medium">Delete Habit</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ---------------------------------------------------------------------------
// FormSection
// ---------------------------------------------------------------------------

const FormSection = memo(function FormSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </Text>
      {children}
    </View>
  );
});
