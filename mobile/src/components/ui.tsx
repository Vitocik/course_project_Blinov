import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type ThemePalette = {
  bg: string;
  card: string;
  cardSoft: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primarySoft: string;
  success: string;
  danger: string;
  warning: string;
  input: string;
  shadow: string;
  chip: string;
};

type AppCardProps = {
  theme: ThemePalette;
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

export function AppCard({ theme, children, style, padded = true }: AppCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
        padded && styles.cardPadded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

type AppButtonProps = {
  theme: ThemePalette;
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
};

export function AppButton({ theme, title, onPress, variant = 'primary', disabled = false, style }: AppButtonProps) {
  const palette =
    variant === 'danger'
      ? { bg: theme.danger, text: '#fff', border: theme.danger }
      : variant === 'secondary'
        ? { bg: theme.cardSoft, text: theme.text, border: theme.border }
        : variant === 'ghost'
          ? { bg: 'transparent', text: theme.text, border: theme.border }
          : { bg: theme.primary, text: '#fff', border: theme.primary };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.55 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: palette.text }]}>{title}</Text>
    </Pressable>
  );
}

type AppInputProps = TextInputProps & {
  theme: ThemePalette;
  label?: string;
  helperText?: string;
};

export function AppInput({ theme, label, helperText, style, ...props }: AppInputProps) {
  return (
    <View style={styles.inputWrap}>
      {!!label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={theme.muted}
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: theme.input,
            color: theme.text,
            borderColor: theme.border,
          },
          style,
        ]}
      />
      {!!helperText && <Text style={[styles.helper, { color: theme.muted }]}>{helperText}</Text>}
    </View>
  );
}

type AppLoaderProps = {
  theme: ThemePalette;
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

export function AppLoader({ theme, title = 'Загружаем данные…', subtitle = 'Подготавливаем интерфейс и синхронизируем кэш.' , compact = false }: AppLoaderProps) {
  return (
    <View style={[styles.loaderWrap, compact && styles.loaderCompact]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loaderTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.loaderSubtitle, { color: theme.muted }]}>{subtitle}</Text>
      <View style={styles.loaderDots}>
        <View style={[styles.loaderDot, { backgroundColor: theme.primary }]} />
        <View style={[styles.loaderDot, { backgroundColor: theme.primarySoft }]} />
        <View style={[styles.loaderDot, { backgroundColor: theme.primary }]} />
      </View>
    </View>
  );
}

type EmptyStateProps = {
  theme: ThemePalette;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ theme, icon = 'inbox-outline', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <AppCard theme={theme} style={styles.emptyState}>
      <View style={[styles.emptyIconWrap, { backgroundColor: theme.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={28} color={theme.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: theme.muted }]}>{description}</Text>
      {!!actionLabel && <AppButton theme={theme} title={actionLabel} onPress={onAction} style={styles.emptyAction} />}
    </AppCard>
  );
}

type AppScreenProps = {
  theme: ThemePalette;
  children: React.ReactNode;
  header?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  contentStyle?: ViewStyle;
};

export function AppScreen({ theme, children, header, refreshing = false, onRefresh, contentStyle }: AppScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={[styles.screenContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} /> : undefined
      }
    >
      {header}
      {children}
    </ScrollView>
  );
}

type SectionHeaderProps = {
  theme: ThemePalette;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function SectionHeader({ theme, title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>{subtitle}</Text>}
      </View>
      {!!action && <View>{action}</View>}
    </View>
  );
}

type MiniStatProps = {
  theme: ThemePalette;
  title: string;
  value: string;
  hint?: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export function MiniStat({ theme, title, value, hint, icon = 'chart-line' }: MiniStatProps) {
  return (
    <AppCard theme={theme} style={styles.miniStat}>
      <View style={styles.miniStatHead}>
        <Text style={[styles.miniStatTitle, { color: theme.muted }]}>{title}</Text>
        <MaterialCommunityIcons name={icon} size={18} color={theme.primary} />
      </View>
      <Text style={[styles.miniStatValue, { color: theme.text }]}>{value}</Text>
      {!!hint && <Text style={[styles.miniStatHint, { color: theme.muted }]}>{hint}</Text>}
    </AppCard>
  );
}

type ChartBarProps = {
  theme: ThemePalette;
  label: string;
  value: number;
  max: number;
  suffix?: string;
};

export function ChartBar({ theme, label, value, max, suffix = '' }: ChartBarProps) {
  const safeMax = Math.max(1, max);
  const width = `${Math.max(8, Math.min(100, (value / safeMax) * 100))}%`;
  return (
    <View style={styles.chartRow}>
      <View style={styles.chartRowTop}>
        <Text style={[styles.chartRowLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.chartRowValue, { color: theme.muted }]}>{value}{suffix}</Text>
      </View>
      <View style={[styles.chartTrack, { backgroundColor: theme.cardSoft }]}>
        <View style={[styles.chartFill, { width, backgroundColor: theme.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 22,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardPadded: {
    padding: 16,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputWrap: {
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  helper: {
    fontSize: 12,
    lineHeight: 16,
  },
  loaderWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  loaderCompact: {
    minHeight: 140,
    paddingVertical: 16,
  },
  loaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  loaderSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  loaderDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  loaderDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 6,
    alignSelf: 'stretch',
  },
  screenContent: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  miniStat: {
    flex: 1,
    minWidth: '47%',
    gap: 8,
  },
  miniStatHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniStatTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  miniStatValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  miniStatHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  chartRow: {
    gap: 8,
  },
  chartRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartRowLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  chartRowValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 999,
  },
});
