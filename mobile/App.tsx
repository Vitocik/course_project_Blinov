
import 'react-native-gesture-handler';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme, type Theme as NavigationTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { enableScreens } from 'react-native-screens';

import { AppProvider, useAppContext } from './src/context/AppContext';
import {
  buildMealPlan,
  buildWorkoutPlan,
  calculateMetrics,
  createDemoMeals,
  createDemoProfile,
  createDemoProgress,
  createDemoWorkouts,
  createInitialState,
  defaultApiUrl,
  createProgressEntry,
  getAverageWeight,
  getCheckInStreak,
  getThemeColors,
  getWeightChange,
  sortProgressEntries,
} from './src/domain';
import type { AdminUser, AppState, MealItem, MealRecord, ProgressEntry, WorkoutDay, WorkoutRecord, UserProfile } from './src/types';
import {
  apiCreateMeal,
  apiCreateProgress,
  apiCreateWorkout,
  apiDeleteMeal,
  apiDeleteProgress,
  apiDeleteWorkout,
  apiGetDashboard,
  apiGetMe,
  apiGetAdminUsers,
  apiGetMeals,
  apiGetNutritionPlan,
  apiGetProgress,
  apiGetWorkoutPlan,
  apiGetWorkouts,
  apiHealth,
  apiLogin,
  apiRegister,
  apiSaveProfile,
  apiUpdateMeal,
  apiUpdateProgress,
  apiUpdateWorkout,
} from './src/api';
import { clearState, loadState, saveState } from './src/storage';
import { AppButton, AppCard, AppInput, AppLoader, AppScreen, EmptyState, MiniStat, SectionHeader, ChartBar } from './src/components/ui';

enableScreens();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AUTH_DEMO_FORM = {
  email: 'demo@coach.local',
  password: 'demo1234',
  fullName: 'Демонстрационный пользователь',
};

const tabIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  dashboard: 'home-outline',
  profile: 'person-outline',
  nutrition: 'restaurant-outline',
  workouts: 'barbell-outline',
  progress: 'stats-chart-outline',
  settings: 'settings-outline',
  admin: 'shield-checkmark-outline',
};

function App() {
  const [state, setState] = useState<AppState>(createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [apiStatus, setApiStatus] = useState('Проверка сервера...');
  const [loadingSync, setLoadingSync] = useState(false);
  const [authForm, setAuthForm] = useState({ ...AUTH_DEMO_FORM });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadState();
      if (!mounted) return;
      setState(loaded);
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveState(state);
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated || !state.apiUrl) return;
    (async () => {
      try {
        const health = await apiHealth(state.apiUrl);
        setApiStatus(`Сервер доступен: ${health.status || 'ok'}`);
      } catch {
        setApiStatus('Сервер недоступен, работает локальный режим');
      }
    })();
  }, [hydrated, state.apiUrl]);

  const theme = getThemeColors(state.theme);
  const navigationTheme: NavigationTheme = useMemo(() => {
    const base = state.theme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.bg,
        card: theme.card,
        text: theme.text,
        border: theme.border,
        primary: theme.primary,
        notification: theme.primary,
      },
    };
  }, [state.theme, theme]);

  const metrics = useMemo(() => calculateMetrics(state.profile), [state.profile]);
  const localNutritionPlan = useMemo(() => buildMealPlan(state.profile), [state.profile]);
  const localWorkoutPlan = useMemo(() => buildWorkoutPlan(state.profile), [state.profile]);
  const sortedProgress = useMemo(() => sortProgressEntries(state.progress), [state.progress]);
  const avgWeight = useMemo(() => getAverageWeight(state.progress), [state.progress]);
  const weightDelta = useMemo(() => getWeightChange(state.progress), [state.progress]);

  const isLoggedIn = Boolean(state.token || state.isDemoMode);
  const currentUserLabel = state.currentUser
    ? `${state.currentUser.email}${state.currentUser.role ? ` • ${state.currentUser.role}` : ''}`
    : state.isDemoMode
      ? 'demo@coach.local'
      : 'Гость';

  const updateState = (updater: any) => {
    setState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  };

  const syncAll = async (overrideState: AppState = state) => {
    if (!overrideState.token || overrideState.isDemoMode) {
      return;
    }
    setLoadingSync(true);
    try {
      const [me, plan, workout, progress, dashboard] = await Promise.all([
        apiGetMe(overrideState.apiUrl, overrideState.token),
        apiGetNutritionPlan(overrideState.apiUrl, overrideState.token),
        apiGetWorkoutPlan(overrideState.apiUrl, overrideState.token),
        apiGetProgress(overrideState.apiUrl, overrideState.token),
        apiGetDashboard(overrideState.apiUrl, overrideState.token),
      ]);

      setState((prev) => ({
        ...prev,
        profile: me.profile || prev.profile,
        nutritionPlan: plan,
        workoutPlan: workout.days || workout,
        progress: progress.items || progress,
        currentUser: dashboard.user || prev.currentUser,
      }));
      setApiStatus('Данные синхронизированы с backend');
    } catch {
      setApiStatus('Синхронизация не удалась, используется локальный кэш');
    } finally {
      setLoadingSync(false);
    }
  };

  useEffect(() => {
    if (hydrated && state.token && !state.isDemoMode) {
      syncAll(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state.token]);

  const handleAuth = async () => {
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password.trim();
    const fullName = authForm.fullName.trim();

    if (!email || !password) {
      setAuthError('Введите email и пароль.');
      return;
    }

    if (!state.apiUrl) {
      setAuthError('Сначала укажи URL backend.');
      return;
    }

    try {
      if (authMode === 'register') {
        const response = await apiRegister(state.apiUrl, {
          email,
          password,
          fullName: fullName || 'Новый пользователь',
        });

        setState((prev) => ({
          ...prev,
          token: response.token,
          currentUser: response.user,
          profile: response.profile,
          nutritionPlan: null,
          workoutPlan: null,
          progress: response.progress || prev.progress,
          meals: [],
          workouts: [],
          isDemoMode: false,
        }));
        setAuthError('');
        await syncAll({
          ...state,
          token: response.token,
          currentUser: response.user,
          profile: response.profile,
          isDemoMode: false,
        });
        return;
      }

      const response = await apiLogin(state.apiUrl, { email, password });
      setState((prev) => ({
        ...prev,
        token: response.token,
        currentUser: response.user,
        profile: response.profile,
        nutritionPlan: null,
        workoutPlan: null,
        progress: response.progress || prev.progress,
        meals: [],
        workouts: [],
        isDemoMode: false,
      }));
      setAuthError('');
      await syncAll({
        ...state,
        token: response.token,
        currentUser: response.user,
        profile: response.profile,
        isDemoMode: false,
      });
    } catch (error: any) {
      setAuthError(error?.response?.data?.message || 'Не удалось выполнить вход. Проверь backend и попробуй снова.');
    }
  };

  const handleDemoLogin = () => {
    const demoProfile = createDemoProfile();
    updateState((prev: AppState) => ({
      ...prev,
      token: null,
      currentUser: { email: 'demo@coach.local', fullName: 'Демонстрационный пользователь' },
      profile: demoProfile,
      nutritionPlan: buildMealPlan(demoProfile),
      workoutPlan: buildWorkoutPlan(demoProfile),
      progress: createDemoProgress(),
      meals: createDemoMeals(),
      workouts: createDemoWorkouts(),
      isDemoMode: true,
    }));
    setAuthError('');
  };

  const logout = () => {
    updateState((prev: AppState) => ({
      ...prev,
      token: null,
      currentUser: null,
      profile: null,
      nutritionPlan: null,
      workoutPlan: null,
      progress: createDemoProgress(),
      meals: createDemoMeals(),
      workouts: createDemoWorkouts(),
      isDemoMode: false,
    }));
  };

  const saveProfile = async (draft: any) => {
    const normalized = {
      ...draft,
      age: Number(draft.age),
      heightCm: Number(draft.heightCm),
      weightKg: Number(draft.weightKg),
      trainingDays: Number(draft.trainingDays),
    };

    if (!normalized.fullName?.trim()) {
      Alert.alert('Ошибка', 'Укажи имя пользователя.');
      return;
    }

    if (state.isDemoMode || !state.token) {
      updateState((prev: AppState) => ({ ...prev, profile: { ...normalized, updatedAt: new Date().toISOString() } }));
      Alert.alert('Готово', 'Профиль сохранён локально.');
      return;
    }

    try {
      const response = await apiSaveProfile(state.apiUrl, state.token, normalized);
      updateState((prev: AppState) => ({
        ...prev,
        profile: response,
        currentUser: prev.currentUser ? { ...prev.currentUser, fullName: response.fullName || prev.currentUser.fullName } : prev.currentUser,
      }));
      setApiStatus('Профиль сохранён на backend');
    } catch {
      const offlineProfile = { ...normalized, updatedAt: new Date().toISOString() };
      updateState((prev: AppState) => ({
        ...prev,
        profile: offlineProfile,
        currentUser: prev.currentUser ? { ...prev.currentUser, fullName: offlineProfile.fullName } : prev.currentUser,
      }));
      setApiStatus('Профиль сохранён локально');
      Alert.alert('Оффлайн-режим', 'Сервер недоступен, профиль сохранён в кэше устройства.');
    }
  };

  const refreshPlans = async () => {
    if (state.isDemoMode || !state.token) {
      updateState((prev: AppState) => ({
        ...prev,
        nutritionPlan: buildMealPlan(prev.profile),
        workoutPlan: buildWorkoutPlan(prev.profile),
      }));
      setApiStatus('Планы пересчитаны локально');
      return;
    }

    try {
      const [nutrition, workout] = await Promise.all([
        apiGetNutritionPlan(state.apiUrl, state.token),
        apiGetWorkoutPlan(state.apiUrl, state.token),
      ]);
      updateState((prev: AppState) => ({ ...prev, nutritionPlan: nutrition, workoutPlan: workout.days || workout }));
      setApiStatus('Планы обновлены с backend');
    } catch {
      updateState((prev: AppState) => ({
        ...prev,
        nutritionPlan: buildMealPlan(prev.profile),
        workoutPlan: buildWorkoutPlan(prev.profile),
      }));
      setApiStatus('Планы обновлены локально');
    }
  };

  const saveProgress = async (entry: ProgressEntry, editingId?: string | null) => {
    const payload = {
      entryDate: entry.entryDate,
      weightKg: Number(entry.weightKg),
      note: entry.note || '',
    };

    if (state.isDemoMode || !state.token) {
      updateState((prev: AppState) => {
        const next = editingId
          ? prev.progress.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
          : [{ id: `local-${Date.now()}`, ...payload }, ...prev.progress];
        return { ...prev, progress: next };
      });
      return;
    }

    try {
      if (editingId) {
        const saved = await apiUpdateProgress(state.apiUrl, state.token, editingId, payload);
        updateState((prev: AppState) => ({
          ...prev,
          progress: prev.progress.map((item) => (String(item.id) === String(editingId) ? saved : item)),
        }));
      } else {
        const saved = await apiCreateProgress(state.apiUrl, state.token, payload);
        updateState((prev: AppState) => ({ ...prev, progress: [saved, ...prev.progress] }));
      }
      setApiStatus('Прогресс синхронизирован');
    } catch {
      updateState((prev: AppState) => {
        const next = editingId
          ? prev.progress.map((item) => (String(item.id) === String(editingId) ? { ...item, ...payload } : item))
          : [{ id: `local-${Date.now()}`, ...payload }, ...prev.progress];
        return { ...prev, progress: next };
      });
      setApiStatus('Прогресс сохранён локально');
      Alert.alert('Оффлайн-режим', 'Запись прогресса сохранена в кэше устройства.');
    }
  };

  const deleteProgress = async (id: string) => {
    if (state.isDemoMode || !state.token) {
      updateState((prev: AppState) => ({ ...prev, progress: prev.progress.filter((item) => String(item.id) !== String(id)) }));
      return;
    }

    try {
      await apiDeleteProgress(state.apiUrl, state.token, id);
      updateState((prev: AppState) => ({ ...prev, progress: prev.progress.filter((item) => String(item.id) !== String(id)) }));
    } catch {
      updateState((prev: AppState) => ({ ...prev, progress: prev.progress.filter((item) => String(item.id) !== String(id)) }));
      setApiStatus('Запись удалена локально');
      Alert.alert('Оффлайн-режим', 'Запись удалена в кэше устройства.');
    }
  };

  const normalizeMealPayload = (draft: Partial<MealRecord>) => ({
    mealName: String(draft.mealName || '').trim(),
    mealType: String(draft.mealType || '').trim(),
    calories: Number(draft.calories) || 0,
    proteins: Number(draft.proteins) || 0,
    fats: Number(draft.fats) || 0,
    carbs: Number(draft.carbs) || 0,
    note: String(draft.note || '').trim(),
  });

  const normalizeWorkoutPayload = (draft: Partial<WorkoutRecord>) => ({
    workoutName: String(draft.workoutName || '').trim(),
    workoutType: String(draft.workoutType || '').trim(),
    durationMinutes: Number(draft.durationMinutes) || 0,
    caloriesBurned: Number(draft.caloriesBurned) || 0,
    description: String(draft.description || '').trim(),
  });

  const saveMeal = async (draft: Partial<MealRecord>, editingId?: string | number | null) => {
    const payload = normalizeMealPayload(draft);
    if (!payload.mealName || !payload.mealType) {
      Alert.alert('Ошибка', 'Заполни название и тип блюда.');
      return;
    }

    if (state.isDemoMode || !state.token) {
      updateState((prev: AppState) => {
        const item = {
          id: editingId ?? `local-meal-${Date.now()}`,
          ...payload,
          createdAt: editingId ? prev.meals.find((m) => String(m.id) === String(editingId))?.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const meals = editingId
          ? prev.meals.map((entry) => (String(entry.id) === String(editingId) ? item : entry))
          : [item, ...prev.meals];
        return { ...prev, meals };
      });
      setApiStatus('Блюдо сохранено локально');
      return;
    }

    try {
      const saved = editingId
        ? await apiUpdateMeal(state.apiUrl, state.token, editingId, payload)
        : await apiCreateMeal(state.apiUrl, state.token, payload);
      updateState((prev: AppState) => {
        const meals = editingId
          ? prev.meals.map((entry) => (String(entry.id) === String(editingId) ? saved : entry))
          : [saved, ...prev.meals];
        return { ...prev, meals };
      });
      setApiStatus('Блюдо сохранено в backend');
    } catch {
      updateState((prev: AppState) => {
        const item = {
          id: editingId ?? `local-meal-${Date.now()}`,
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        const meals = editingId
          ? prev.meals.map((entry) => (String(entry.id) === String(editingId) ? item : entry))
          : [item, ...prev.meals];
        return { ...prev, meals };
      });
      setApiStatus('Блюдо сохранено локально');
      Alert.alert('Оффлайн-режим', 'Блюдо сохранено в кэше устройства.');
    }
  };

  const deleteMeal = async (id: string | number) => {
    if (state.isDemoMode || !state.token) {
      updateState((prev: AppState) => ({ ...prev, meals: prev.meals.filter((item) => String(item.id) !== String(id)) }));
      return;
    }

    try {
      await apiDeleteMeal(state.apiUrl, state.token, id);
      updateState((prev: AppState) => ({ ...prev, meals: prev.meals.filter((item) => String(item.id) !== String(id)) }));
      setApiStatus('Блюдо удалено');
    } catch {
      updateState((prev: AppState) => ({ ...prev, meals: prev.meals.filter((item) => String(item.id) !== String(id)) }));
      setApiStatus('Блюдо удалено локально');
      Alert.alert('Оффлайн-режим', 'Блюдо удалено в кэше устройства.');
    }
  };

  const saveWorkout = async (draft: Partial<WorkoutRecord>, editingId?: string | number | null) => {
    const payload = normalizeWorkoutPayload(draft);
    if (!payload.workoutName || !payload.workoutType || !payload.description) {
      Alert.alert('Ошибка', 'Заполни название, тип и описание тренировки.');
      return;
    }

    if (state.isDemoMode || !state.token) {
      updateState((prev: AppState) => {
        const item = {
          id: editingId ?? `local-workout-${Date.now()}`,
          ...payload,
          createdAt: editingId ? prev.workouts.find((w) => String(w.id) === String(editingId))?.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const workouts = editingId
          ? prev.workouts.map((entry) => (String(entry.id) === String(editingId) ? item : entry))
          : [item, ...prev.workouts];
        return { ...prev, workouts };
      });
      setApiStatus('Тренировка сохранена локально');
      return;
    }

    try {
      const saved = editingId
        ? await apiUpdateWorkout(state.apiUrl, state.token, editingId, payload)
        : await apiCreateWorkout(state.apiUrl, state.token, payload);
      updateState((prev: AppState) => {
        const workouts = editingId
          ? prev.workouts.map((entry) => (String(entry.id) === String(editingId) ? saved : entry))
          : [saved, ...prev.workouts];
        return { ...prev, workouts };
      });
      setApiStatus('Тренировка сохранена в backend');
    } catch {
      updateState((prev: AppState) => {
        const item = {
          id: editingId ?? `local-workout-${Date.now()}`,
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        const workouts = editingId
          ? prev.workouts.map((entry) => (String(entry.id) === String(editingId) ? item : entry))
          : [item, ...prev.workouts];
        return { ...prev, workouts };
      });
      setApiStatus('Тренировка сохранена локально');
      Alert.alert('Оффлайн-режим', 'Тренировка сохранена в кэше устройства.');
    }
  };

  const deleteWorkout = async (id: string | number) => {
    if (state.isDemoMode || !state.token) {
      updateState((prev: AppState) => ({ ...prev, workouts: prev.workouts.filter((item) => String(item.id) !== String(id)) }));
      return;
    }

    try {
      await apiDeleteWorkout(state.apiUrl, state.token, id);
      updateState((prev: AppState) => ({ ...prev, workouts: prev.workouts.filter((item) => String(item.id) !== String(id)) }));
      setApiStatus('Тренировка удалена');
    } catch {
      updateState((prev: AppState) => ({ ...prev, workouts: prev.workouts.filter((item) => String(item.id) !== String(id)) }));
      setApiStatus('Тренировка удалена локально');
      Alert.alert('Оффлайн-режим', 'Тренировка удалена в кэше устройства.');
    }
  };

  const resetAll = async () => {
    Alert.alert('Сбросить всё?', 'Будут удалены локальные данные приложения.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Сбросить',
        style: 'destructive',
        onPress: async () => {
          await clearState();
          setState(createInitialState());
          setAuthError('');
          setApiStatus('Состояние очищено');
          setAuthForm({ ...AUTH_DEMO_FORM });
        },
      },
    ]);
  };

  const toggleTheme = () => updateState((prev: AppState) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  const setApiUrl = (value: string) => updateState((prev: AppState) => ({ ...prev, apiUrl: value }));

  const appContextValue = useMemo(
    () => ({
      apiUrl: state.apiUrl,
      accessToken: state.token,
      currentUserLabel,
      currentUserRole: state.currentUser?.role || '',
      isDemoMode: state.isDemoMode,
      apiStatus,
      themeMode: state.theme,
      setApiUrl,
      onLogout: logout,
      onToggleTheme: toggleTheme,
      onPing: async () => {
        try {
          await apiHealth(state.apiUrl);
          setApiStatus('Сервер отвечает');
        } catch {
          setApiStatus('Сервер недоступен');
        }
      },
    }),
    [apiStatus, currentUserLabel, state.apiUrl, state.currentUser?.role, state.isDemoMode, state.theme],
  );

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={state.theme === 'dark' ? 'light-content' : 'dark-content'} />
        <AppLoader theme={theme} title="Загрузка приложения…" subtitle="Читаем кэш и готовим интерфейс." />
      </SafeAreaView>
    );
  }

  return (
    <AppProvider value={appContextValue}>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
          {!isLoggedIn ? (
            <Stack.Screen name="Auth">
              {() => (
                <SafeAreaView style={[styles.full, { backgroundColor: theme.bg }]}>
                  <StatusBar barStyle={state.theme === 'dark' ? 'light-content' : 'dark-content'} />
                  <AuthScreen
                    theme={theme}
                    authMode={authMode}
                    setAuthMode={setAuthMode}
                    authForm={authForm}
                    setAuthForm={setAuthForm}
                    onSubmit={handleAuth}
                    onDemoLogin={handleDemoLogin}
                    apiUrl={state.apiUrl}
                    setApiUrl={setApiUrl}
                    error={authError}
                    apiStatus={apiStatus}
                  />
                </SafeAreaView>
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Main">
              {() => (
                <MainTabs
                  theme={theme}
                  state={state}
                  metrics={metrics}
                  localNutritionPlan={localNutritionPlan}
                  localWorkoutPlan={localWorkoutPlan}
                  sortedProgress={sortedProgress}
                  avgWeight={avgWeight}
                  weightDelta={weightDelta}
                  loadingSync={loadingSync}
                  refreshPlans={refreshPlans}
                  saveProfile={saveProfile}
                  syncAll={syncAll}
                  saveProgress={saveProgress}
                  deleteProgress={deleteProgress}
                  saveMeal={saveMeal}
                  deleteMeal={deleteMeal}
                  saveWorkout={saveWorkout}
                  deleteWorkout={deleteWorkout}
                  resetAll={resetAll}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

function MainTabs({
  theme,
  state,
  metrics,
  localNutritionPlan,
  localWorkoutPlan,
  sortedProgress,
  avgWeight,
  weightDelta,
  loadingSync,
  refreshPlans,
  saveProfile,
  syncAll,
  saveProgress,
  deleteProgress,
  saveMeal,
  deleteMeal,
  saveWorkout,
  deleteWorkout,
  resetAll,
}: {
  theme: ReturnType<typeof getThemeColors>;
  state: AppState;
  metrics: ReturnType<typeof calculateMetrics>;
  localNutritionPlan: ReturnType<typeof buildMealPlan>;
  localWorkoutPlan: ReturnType<typeof buildWorkoutPlan>;
  sortedProgress: ProgressEntry[];
  avgWeight: number;
  weightDelta: number;
  loadingSync: boolean;
  refreshPlans: () => Promise<void>;
  saveProfile: (draft: any) => Promise<void>;
  syncAll: (overrideState?: AppState) => Promise<void>;
  saveProgress: (entry: ProgressEntry, editingId?: string | null) => Promise<void>;
  deleteProgress: (id: string) => Promise<void>;
  saveMeal: (draft: Partial<MealRecord>, editingId?: string | number | null) => Promise<void>;
  deleteMeal: (id: string | number) => Promise<void>;
  saveWorkout: (draft: Partial<WorkoutRecord>, editingId?: string | number | null) => Promise<void>;
  deleteWorkout: (id: string | number) => Promise<void>;
  resetAll: () => Promise<void>;
}) {
  return (
    <View style={[styles.full, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={state.theme === 'dark' ? 'light-content' : 'dark-content'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          lazy: true,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            height: 66,
            paddingTop: 8,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarIcon: ({ color, size }) => {
            const icon = tabIconMap[route.name] || 'ellipse-outline';
            return <Ionicons name={icon as any} size={size ?? 20} color={color} />;
          },
        })}
      >
        <Tab.Screen name="dashboard" options={{ title: 'Главная' }}>
          {({ navigation }) => (
            <DashboardScreen
              theme={theme}
              profile={state.profile}
              metrics={metrics}
              nutritionPlan={state.nutritionPlan || localNutritionPlan}
              workoutPlan={state.workoutPlan || localWorkoutPlan}
              progress={sortedProgress}
              avgWeight={avgWeight}
              weightDelta={weightDelta}
              onGoTo={(route) => navigation.navigate(route as never)}
              loadingSync={loadingSync}
              onRefresh={refreshPlans}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="profile" options={{ title: 'Профиль' }}>
          {() => <ProfileScreen theme={theme} profile={state.profile} metrics={metrics} onSave={saveProfile} onRefresh={syncAll} />}
        </Tab.Screen>
        <Tab.Screen name="nutrition" options={{ title: 'Питание' }}>
          {() => (
            <NutritionScreen
              theme={theme}
              profile={state.profile}
              metrics={metrics}
              plan={state.nutritionPlan || localNutritionPlan}
              meals={state.meals}
              onRefresh={refreshPlans}
              onSaveMeal={saveMeal}
              onDeleteMeal={deleteMeal}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="workouts" options={{ title: 'Тренировки' }}>
          {() => (
            <WorkoutsScreen
              theme={theme}
              profile={state.profile}
              plan={state.workoutPlan || localWorkoutPlan}
              workouts={state.workouts}
              onRefresh={refreshPlans}
              onSaveWorkout={saveWorkout}
              onDeleteWorkout={deleteWorkout}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="progress" options={{ title: 'Прогресс' }}>
          {() => (
            <ProgressScreen
              theme={theme}
              profile={state.profile}
              entries={sortedProgress}
              averageWeight={avgWeight}
              weightDelta={weightDelta}
              onSave={saveProgress}
              onDelete={deleteProgress}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="settings" options={{ title: 'Настройки' }}>
          {() => <SettingsScreen theme={theme} onResetAll={resetAll} />}
        </Tab.Screen>
        {state.currentUser?.role === 'ADMIN' && (
          <Tab.Screen name="admin" options={{ title: 'Админ' }}>
            {() => <AdminScreen theme={theme} currentUserLabel={currentUserString(state.currentUser)} />}
          </Tab.Screen>
        )}
      </Tab.Navigator>
    </View>
  );
}

function currentUserString(user: AppState['currentUser']) {
  if (!user) return 'ADMIN';
  return `${user.email}${user.role ? ` • ${user.role}` : ''}`;
}


function AdminScreen({ theme, currentUserLabel }: { theme: ReturnType<typeof getThemeColors>; currentUserLabel: string }) {
  const { apiUrl, accessToken, apiStatus } = useAppContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');

  const loadUsers = async () => {
    if (!accessToken) {
      setUsers([]);
      setUsersError('Нет токена администратора.');
      return;
    }

    setLoadingUsers(true);
    setUsersError('');
    try {
      const response = await apiGetAdminUsers(apiUrl, accessToken);
      setUsers(Array.isArray(response) ? response : []);
    } catch (error: any) {
      setUsersError(error?.response?.data?.message || 'Не удалось загрузить список пользователей.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, accessToken]);

  const normalized = query.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    if (!normalized) return users;
    return users.filter((user) =>
      [user.email, user.fullName, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [normalized, users]);

  const totalUsers = users.length;
  const adminUsers = users.filter((user) => String(user.role).toUpperCase() === 'ADMIN').length;
  const regularUsers = Math.max(0, totalUsers - adminUsers);
  const roleChartMax = Math.max(totalUsers, 1);

  return (
    <AppScreen
      theme={theme}
      refreshing={loadingUsers}
      onRefresh={loadUsers}
      contentStyle={styles.scrollContent}
      header={<Header theme={theme} />}
    >
      <SectionTitle theme={theme} title="Администрирование" subtitle="Панель контроля пользователей, статистики и модерации" />

      <View style={styles.grid2}>
        <MiniStat theme={theme} title="Пользователи" value={`${totalUsers}`} hint="Всего в системе" icon="account-multiple" />
        <MiniStat theme={theme} title="Админы" value={`${adminUsers}`} hint="Доступ к /api/admin" icon="shield-account" />
        <MiniStat theme={theme} title="USER" value={`${regularUsers}`} hint="Обычные аккаунты" icon="account" />
        <MiniStat theme={theme} title="Статус API" value={loadingUsers ? '...' : 'OK'} hint={apiStatus} icon="server" />
      </View>

      <AppCard theme={theme}>
        <SectionHeader
          theme={theme}
          title="Управление пользователями"
          subtitle="Фильтр и быстрый обзор списка"
          action={<AppButton theme={theme} title={loadingUsers ? 'Обновляем…' : 'Обновить'} variant="secondary" onPress={loadUsers} />}
        />
        <AppInput
          theme={theme}
          label="Поиск"
          value={query}
          onChangeText={setQuery}
          placeholder="Email, имя или роль"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.analyticsGap}>
          <ChartBar theme={theme} label="Всего" value={totalUsers} max={roleChartMax} suffix="" />
          <ChartBar theme={theme} label="ADMIN" value={adminUsers} max={roleChartMax} suffix="" />
          <ChartBar theme={theme} label="USER" value={regularUsers} max={roleChartMax} suffix="" />
        </View>
        {!!usersError && <Text style={[styles.errorText, { color: theme.danger }]}>{usersError}</Text>}
      </AppCard>

      {loadingUsers && !users.length ? (
        <AppLoader theme={theme} compact title="Загрузка пользователей…" subtitle="Собираем данные для административной панели." />
      ) : filteredUsers.length ? (
        filteredUsers.map((user) => (
          <View key={String(user.id)}>
            <AppCard theme={theme} style={styles.adminUserCard}>
            <View style={styles.adminUserTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{user.fullName || 'Без имени'}</Text>
                <Text style={{ color: theme.muted }}>{user.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: user.role === 'ADMIN' ? theme.primarySoft : theme.cardSoft }]}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{user.role}</Text>
              </View>
            </View>
            <Bullet theme={theme} text={`ID: ${user.id}`} />
            <Bullet theme={theme} text={user.role === 'ADMIN' ? 'Полный доступ к админ-разделу и защищённым методам.' : 'Обычный пользователь приложения.'} />
          </AppCard>
          </View>
        ))
      ) : (
        <EmptyState
          theme={theme}
          icon="account-search-outline"
          title="Пользователи не найдены"
          description="Измени фильтр или обнови список, чтобы увидеть актуальные данные."
          actionLabel="Сбросить фильтр"
          onAction={() => setQuery('')}
        />
      )}

      <AppCard theme={theme}>
        <SectionHeader theme={theme} title="Модерация и отчётность" subtitle="Что можно показать на защите курсовой" />
        <Bullet theme={theme} text="Пользователи доступны через защищённый endpoint /api/admin/users." />
        <Bullet theme={theme} text="Роли разделены на USER и ADMIN, доступ ограничен Spring Security." />
        <Bullet theme={theme} text="Статистика и список пользователей могут быть расширены без изменения архитектуры." />
        <Bullet theme={theme} text={`Активный администратор: ${currentUserLabel}`} />
      </AppCard>
    </AppScreen>
  );
}


function Header({ theme, loadingSync = false }: { theme: ReturnType<typeof getThemeColors>; loadingSync?: boolean }) {
  const { currentUserLabel, isDemoMode, onLogout, apiStatus, themeMode, onToggleTheme } = useAppContext();
  return (
    <View style={[styles.header, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={styles.headerLeft}>
        <View style={[styles.logoCircle, { backgroundColor: theme.primarySoft }]}>
          <MaterialCommunityIcons name="leaf" size={22} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.appTitle, { color: theme.text }]}>Nutrition Coach</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}></Text>
          <View style={styles.headerMetaRow}>
            <StatusPill theme={theme} text={currentUserLabel} tone="neutral" />
            <StatusPill theme={theme} text={isDemoMode ? 'Демо' : 'Сервер'} tone={isDemoMode ? 'warning' : 'success'} />
            <StatusPill theme={theme} text={loadingSync ? 'Синхронизация…' : apiStatus} tone={loadingSync ? 'neutral' : 'accent'} />
          </View>
        </View>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.themeToggleRow}>
          <Text style={{ color: theme.muted, fontSize: 12, fontWeight: '700' }}>{themeMode === 'dark' ? 'Тёмная' : 'Светлая'}</Text>
          <Switch value={themeMode === 'dark'} onValueChange={onToggleTheme} />
        </View>
        <Pressable onPress={onLogout} style={[styles.smallButton, { borderColor: theme.border, backgroundColor: theme.cardSoft }]}>
          <Text style={{ color: theme.text, fontWeight: '700' }}>Выйти</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AuthScreen({
  theme,
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  onSubmit,
  onDemoLogin,
  apiUrl,
  setApiUrl,
  error,
  apiStatus,
}: {
  theme: ReturnType<typeof getThemeColors>;
  authMode: 'login' | 'register';
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'register'>>;
  authForm: { email: string; password: string; fullName: string };
  setAuthForm: React.Dispatch<React.SetStateAction<{ email: string; password: string; fullName: string }>>;
  onSubmit: () => Promise<void>;
  onDemoLogin: () => void;
  apiUrl: string;
  setApiUrl: (value: string) => void;
  error: string;
  apiStatus: string;
}) {
  const setField = (key: 'email' | 'password' | 'fullName', value: string) =>
    setAuthForm((prev) => ({ ...prev, [key]: value }));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
        <Card theme={theme}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: theme.primarySoft }]}>
              <MaterialCommunityIcons name="camera-iris" size={30} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>Вход в приложение</Text>
            </View>
          </View>

          <SegmentRow
            theme={theme}
            left={{ label: 'Вход', active: authMode === 'login', onPress: () => setAuthMode('login') }}
            right={{ label: 'Регистрация', active: authMode === 'register', onPress: () => setAuthMode('register') }}
          />

          <Field theme={theme} label="API URL" value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" placeholder={defaultApiUrl} />
          <Field theme={theme} label="Email" value={authForm.email} onChangeText={(v) => setField('email', v)} autoCapitalize="none" placeholder="name@example.com" />
          {authMode === 'register' && (
            <Field theme={theme} label="Имя" value={authForm.fullName} onChangeText={(v) => setField('fullName', v)} placeholder="Ваше имя" />
          )}
          <Field theme={theme} label="Пароль" value={authForm.password} onChangeText={(v) => setField('password', v)} secureTextEntry placeholder="Введите пароль" />

          {!!error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

          <PrimaryButton theme={theme} label={authMode === 'login' ? 'Войти' : 'Создать аккаунт'} onPress={onSubmit} />
          <SecondaryButton theme={theme} label="Открыть демо-режим" onPress={onDemoLogin} />

          <View style={styles.authMetaCard}>
            <StatusPill theme={theme} text={apiStatus} tone="neutral" />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


function DashboardScreen({
  theme,
  profile,
  metrics,
  nutritionPlan,
  workoutPlan,
  progress,
  avgWeight,
  weightDelta,
  onGoTo,
  loadingSync,
  onRefresh,
}: {
  theme: ReturnType<typeof getThemeColors>;
  profile: UserProfile | null;
  metrics: ReturnType<typeof calculateMetrics>;
  nutritionPlan: ReturnType<typeof buildMealPlan>;
  workoutPlan: ReturnType<typeof buildWorkoutPlan>;
  progress: ProgressEntry[];
  avgWeight: number;
  weightDelta: number;
  onGoTo: (route: string) => void;
  loadingSync: boolean;
  onRefresh: () => Promise<void>;
}) {
  const latestProgress = progress[0];
  const previousProgress = progress[1];
  const trendText =
    latestProgress && previousProgress
      ? `${latestProgress.weightKg >= previousProgress.weightKg ? '+' : ''}${(latestProgress.weightKg - previousProgress.weightKg).toFixed(1)} кг`
      : 'Нет данных';
  const firstMeal = nutritionPlan.items?.[0];
  const firstWorkout = workoutPlan[0];
  const chartEntries = progress.slice(0, 6).reverse();
  const chartMin = chartEntries.length ? Math.min(...chartEntries.map((entry) => Number(entry.weightKg) || 0)) : 0;
  const chartMax = chartEntries.length ? Math.max(...chartEntries.map((entry) => Number(entry.weightKg) || 0)) : 0;

  const workoutDaysCount = workoutPlan.length;
  const workoutExercises = workoutPlan.reduce((sum, day) => sum + day.exercises.length, 0);
  const workoutMinutes = workoutPlan.reduce((sum, day) => sum + estimateWorkoutMinutes(day), 0);
  const waterTarget = profile ? Math.max(2, Number((Number(profile.weightKg || 0) * 0.035).toFixed(1))) : 2;
  const streak = getCheckInStreak(progress);
  const proteinRatio = Math.round(metrics.protein);
  const fatsRatio = Math.round(metrics.fats);
  const carbsRatio = Math.round(metrics.carbs);
  const macroMax = Math.max(proteinRatio, fatsRatio, carbsRatio, 1);

  return (
    <AppScreen
      theme={theme}
      refreshing={loadingSync}
      onRefresh={onRefresh}
      contentStyle={styles.scrollContent}
      header={<Header theme={theme} loadingSync={loadingSync} />}
    >
      <SectionTitle theme={theme} title="Обзор" subtitle="Сводка по профилю, активности и рекомендациям" />

      <View style={styles.grid2}>
        <StatCard theme={theme} title="Цель" value={metrics.weightGoalText} icon="target" />
        <StatCard theme={theme} title="Калории" value={`${metrics.calories} ккал`} icon="fire" />
        <StatCard theme={theme} title="BMI" value={profile ? String(metrics.bmi) : '—'} icon="scale-bathroom" />
        <StatCard theme={theme} title="Тренд" value={trendText} icon="trending-up" />
      </View>

      <View style={styles.grid2}>
        <MiniStat theme={theme} title="Серия" value={`${streak} нед.`} hint="Стабильность чек-инов" icon="calendar-check" />
        <MiniStat theme={theme} title="Вода" value={`${waterTarget.toFixed(1)} л`} hint="Цель на день" icon="water" />
        <MiniStat theme={theme} title="Тренировки" value={`${workoutDaysCount}`} hint={`${workoutExercises} упражнений`} icon="dumbbell" />
        <MiniStat theme={theme} title="Время" value={`${workoutMinutes} мин`} hint="Оценка недели" icon="clock-outline" />
      </View>

      <Card theme={theme}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Ключевые показатели</Text>
          <AppButton theme={theme} title={loadingSync ? 'Обновляем…' : 'Обновить'} variant="secondary" onPress={onRefresh} />
        </View>
        <MetricBar theme={theme} label="Белки" value={metrics.protein} total={Math.max(1, Math.round(metrics.calories / 10))} />
        <MetricBar theme={theme} label="Жиры" value={metrics.fats} total={Math.max(1, Math.round(metrics.calories / 20))} />
        <MetricBar theme={theme} label="Углеводы" value={metrics.carbs} total={Math.max(1, Math.round(metrics.calories / 6))} />
        <MetricBar theme={theme} label="BMR → TDEE" value={metrics.tdee} total={Math.max(1, metrics.tdee)} />
      </Card>

      <AppCard theme={theme}>
        <SectionHeader theme={theme} title="Аналитика недели" subtitle="Питание, прогресс и нагрузка в одном блоке" />
        <View style={styles.analyticsGap}>
          <ChartBar theme={theme} label="Белки" value={proteinRatio} max={macroMax} suffix=" г" />
          <ChartBar theme={theme} label="Жиры" value={fatsRatio} max={macroMax} suffix=" г" />
          <ChartBar theme={theme} label="Углеводы" value={carbsRatio} max={macroMax} suffix=" г" />
          <ChartBar theme={theme} label="Прогресс" value={progress.length} max={Math.max(1, progress.length || 1)} suffix=" записей" />
        </View>
      </AppCard>

      <View style={styles.grid2}>
        <InfoTile
          theme={theme}
          title="Питание"
          body={firstMeal ? `${firstMeal.mealType}: ${firstMeal.name}` : 'План ещё не рассчитан'}
          icon="food-apple"
          onPress={() => onGoTo('nutrition')}
        />
        <InfoTile
          theme={theme}
          title="Тренировка"
          body={firstWorkout ? `${firstWorkout.day}: ${firstWorkout.focus}` : 'План ещё не рассчитан'}
          icon="dumbbell"
          onPress={() => onGoTo('workouts')}
        />
      </View>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Что уже готово</Text>
        <Bullet theme={theme} text={`План питания: ${nutritionPlan.items?.length || 0} приёмов.`} />
        <Bullet theme={theme} text={`План тренировок: ${workoutPlan.length || 0} тренировочных дней.`} />
        <Bullet theme={theme} text={`Записей прогресса: ${progress.length}.`} />
        <Bullet theme={theme} text={`Средний вес: ${avgWeight || '—'} кг.`} />
        <Bullet theme={theme} text={`Изменение веса: ${weightDelta >= 0 ? '+' : ''}${weightDelta} кг.`} />
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>График веса</Text>
        {chartEntries.length ? (
          <View style={styles.chartWrap}>
            <View style={styles.chartBars}>
              {chartEntries.map((entry) => {
                const value = Number(entry.weightKg) || 0;
                const normalized = chartMax === chartMin ? 0.7 : (value - chartMin) / Math.max(1, chartMax - chartMin);
                const height = 24 + normalized * 92;
                return (
                  <View key={entry.id} style={styles.chartBarItem}>
                    <View style={[styles.chartBar, { backgroundColor: theme.primary, height }]} />
                    <Text style={[styles.chartValue, { color: theme.text }]}>{value.toFixed(1)}</Text>
                    <Text style={[styles.chartLabel, { color: theme.muted }]}>{entry.entryDate.slice(5)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <EmptyState
            theme={theme}
            icon="chart-line-variant"
            title="График пока пуст"
            description="Добавь несколько записей прогресса, и здесь появится аналитика по весу."
            actionLabel="Перейти к прогрессу"
            onAction={() => onGoTo('progress')}
          />
        )}
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Быстрые переходы</Text>
        <View style={styles.quickGrid}>
          <QuickAction theme={theme} label="Профиль" icon="person" onPress={() => onGoTo('profile')} />
          <QuickAction theme={theme} label="Питание" icon="restaurant-outline" onPress={() => onGoTo('nutrition')} />
          <QuickAction theme={theme} label="Тренировки" icon="barbell-outline" onPress={() => onGoTo('workouts')} />
          <QuickAction theme={theme} label="Прогресс" icon="stats-chart" onPress={() => onGoTo('progress')} />
        </View>
      </Card>
    </AppScreen>
  );
}


function ProfileScreen({
  theme,
  profile,
  metrics,
  onSave,
  onRefresh,
}: {
  theme: ReturnType<typeof getThemeColors>;
  profile: UserProfile | null;
  metrics: ReturnType<typeof calculateMetrics>;
  onSave: (draft: any) => Promise<void>;
  onRefresh: (overrideState?: AppState) => Promise<void>;
}) {
  const [draft, setDraft] = useState<any>(
    profile || {
      fullName: '',
      age: '20',
      sex: 'female',
      heightCm: '168',
      weightKg: '60',
      activity: 'moderate',
      goal: 'maintain',
      trainingDays: '3',
      allergies: '',
      notes: '',
    },
  );
  const preview = useMemo(() => ({
    ...draft,
    age: Number(draft.age),
    heightCm: Number(draft.heightCm),
    weightKg: Number(draft.weightKg),
    trainingDays: Number(draft.trainingDays),
  }), [draft]);
  const previewMetrics = useMemo(() => calculateMetrics(preview), [preview]);

  useEffect(() => {
    if (profile) {
      setDraft({
        ...profile,
        age: String(profile.age),
        heightCm: String(profile.heightCm),
        weightKg: String(profile.weightKg),
        trainingDays: String(profile.trainingDays),
      });
    }
  }, [profile]);

  const setField = (key: string, value: string | number) => setDraft((prev: any) => ({ ...prev, [key]: value }));

  const fillDemo = () => {
    const demo = createDemoProfile();
    setDraft({
      ...demo,
      age: String(demo.age),
      heightCm: String(demo.heightCm),
      weightKg: String(demo.weightKg),
      trainingDays: String(demo.trainingDays),
    });
  };

  const incrementTrainingDays = (delta: number) => {
    const current = Math.max(1, Number(draft.trainingDays) || 1);
    setField('trainingDays', String(Math.min(7, Math.max(1, current + delta))));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Header theme={theme} />
      <SectionTitle theme={theme} title="Профиль" subtitle="Данные для расчёта питания и тренировок" />
      <View style={styles.grid2}>
        <StatCard theme={theme} title="BMI" value={profile ? String(metrics.bmi) : String(previewMetrics.bmi || '—')} icon="scale-balance" />
        <StatCard theme={theme} title="BMR" value={profile ? String(metrics.bmr) : String(previewMetrics.bmr || '—')} icon="lightning-bolt" />
        <StatCard theme={theme} title="TDEE" value={profile ? String(metrics.tdee) : String(previewMetrics.tdee || '—')} icon="calculator" />
        <StatCard theme={theme} title="Калории" value={profile ? String(metrics.calories) : String(previewMetrics.calories || '—')} icon="food" />
      </View>

      <Card theme={theme}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Основные данные</Text>
          <Pressable onPress={fillDemo} style={[styles.inlineAction, { borderColor: theme.border, backgroundColor: theme.cardSoft }]}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>Заполнить демо</Text>
          </Pressable>
        </View>
        <Field theme={theme} label="Имя" value={draft.fullName || ''} onChangeText={(v) => setField('fullName', v)} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Возраст" value={String(draft.age ?? '')} onChangeText={(v) => setField('age', v)} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Рост, см" value={String(draft.heightCm ?? '')} onChangeText={(v) => setField('heightCm', v)} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Вес, кг" value={String(draft.weightKg ?? '')} onChangeText={(v) => setField('weightKg', v)} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Тренировок / нед." value={String(draft.trainingDays ?? '')} onChangeText={(v) => setField('trainingDays', v)} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.stepperRow}>
          <MiniButton theme={theme} label="−" onPress={() => incrementTrainingDays(-1)} />
          <Text style={{ color: theme.text, fontWeight: '800' }}>Тренировок в неделю: {String(draft.trainingDays || 0)}</Text>
          <MiniButton theme={theme} label="+" onPress={() => incrementTrainingDays(1)} />
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Пол</Text>
        <SegmentRow
          theme={theme}
          left={{ label: 'Мужской', active: draft.sex === 'male', onPress: () => setField('sex', 'male') }}
          right={{ label: 'Женский', active: draft.sex === 'female', onPress: () => setField('sex', 'female') }}
        />

        <Text style={[styles.label, { color: theme.text }]}>Активность</Text>
        <SegmentRow
          theme={theme}
          left={{ label: 'Низкая', active: draft.activity === 'low', onPress: () => setField('activity', 'low') }}
          right={{ label: 'Средняя', active: draft.activity === 'moderate', onPress: () => setField('activity', 'moderate') }}
        />
        <SegmentRow
          theme={theme}
          left={{ label: 'Высокая', active: draft.activity === 'high', onPress: () => setField('activity', 'high') }}
          right={{ label: 'Сбросить', active: false, onPress: () => setField('activity', 'moderate') }}
        />

        <Text style={[styles.label, { color: theme.text }]}>Цель</Text>
        <SegmentRow
          theme={theme}
          left={{ label: 'Похудение', active: draft.goal === 'lose_weight', onPress: () => setField('goal', 'lose_weight') }}
          right={{ label: 'Поддержание', active: draft.goal === 'maintain', onPress: () => setField('goal', 'maintain') }}
        />
        <SegmentRow
          theme={theme}
          left={{ label: 'Масса', active: draft.goal === 'gain_muscle', onPress: () => setField('goal', 'gain_muscle') }}
          right={{ label: 'По умолч.', active: false, onPress: () => setField('goal', 'maintain') }}
        />

        <Field theme={theme} label="Аллергии / ограничения" value={draft.allergies || ''} onChangeText={(v) => setField('allergies', v)} />
        <Field theme={theme} label="Заметки" value={draft.notes || ''} onChangeText={(v) => setField('notes', v)} multiline />

        <Card theme={theme}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Живой расчёт</Text>
          <Bullet theme={theme} text={`BMI: ${previewMetrics.bmi || '—'}`} />
          <Bullet theme={theme} text={`Цель: ${previewMetrics.weightGoalText}`} />
          <Bullet theme={theme} text={`Калории: ${previewMetrics.calories || '—'} ккал`} />
        </Card>

        <PrimaryButton theme={theme} label="Сохранить профиль" onPress={() => onSave(draft)} />
        <SecondaryButton theme={theme} label="Обновить с сервера" onPress={onRefresh} />
      </Card>
    </ScrollView>
  );
}


function NutritionScreen({
  theme,
  profile,
  metrics,
  plan,
  meals,
  onRefresh,
  onSaveMeal,
  onDeleteMeal,
}: {
  theme: ReturnType<typeof getThemeColors>;
  profile: UserProfile | null;
  metrics: ReturnType<typeof calculateMetrics>;
  plan: ReturnType<typeof buildMealPlan>;
  meals: MealRecord[];
  onRefresh: () => Promise<void>;
  onSaveMeal: (draft: Partial<MealRecord>, editingId?: string | number | null) => Promise<void>;
  onDeleteMeal: (id: string | number) => Promise<void>;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMealId, setSelectedMealId] = useState<string | number | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    mealName: '',
    mealType: '',
    calories: '',
    proteins: '',
    fats: '',
    carbs: '',
    note: '',
  });

  const items = plan.items || [];
  const selectedItem = items[selectedIndex] || items[0];

  const filteredMeals = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = [...(meals || [])];
    list.sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
    if (!normalized) return list;
    return list.filter((meal) =>
      [meal.mealName, meal.mealType, meal.note]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [meals, query]);

  const selectedMeal = filteredMeals.find((meal) => String(meal.id) === String(selectedMealId)) || filteredMeals[0] || null;

  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length, plan.calories]);

  useEffect(() => {
    if (!selectedMealId && filteredMeals.length) {
      setSelectedMealId(filteredMeals[0].id);
    }
    if (selectedMealId && !filteredMeals.some((meal) => String(meal.id) === String(selectedMealId))) {
      setSelectedMealId(filteredMeals[0]?.id || null);
    }
  }, [filteredMeals, selectedMealId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      mealName: '',
      mealType: '',
      calories: '',
      proteins: '',
      fats: '',
      carbs: '',
      note: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setQuery('');
  };

  const openEdit = (meal: MealRecord) => {
    setEditingId(meal.id);
    setForm({
      mealName: meal.mealName || '',
      mealType: meal.mealType || '',
      calories: String(meal.calories ?? ''),
      proteins: String(meal.proteins ?? ''),
      fats: String(meal.fats ?? ''),
      carbs: String(meal.carbs ?? ''),
      note: meal.note || '',
    });
  };

  const fillFromPlan = () => {
    if (!selectedItem) return;
    setEditingId(null);
    setForm({
      mealName: selectedItem.name,
      mealType: selectedItem.mealType,
      calories: String(selectedItem.calories),
      proteins: String(selectedItem.protein),
      fats: String(selectedItem.fats),
      carbs: String(selectedItem.carbs),
      note: selectedItem.note || '',
    });
  };

  const submit = async () => {
    await onSaveMeal(
      {
        mealName: form.mealName,
        mealType: form.mealType,
        calories: Number(form.calories),
        proteins: Number(form.proteins),
        fats: Number(form.fats),
        carbs: Number(form.carbs),
        note: form.note,
      },
      editingId,
    );
    openCreate();
  };

  const removeMeal = (meal: MealRecord) => {
    Alert.alert('Удалить блюдо?', meal.mealName, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => onDeleteMeal(meal.id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Header theme={theme} />
      <SectionTitle theme={theme} title="Питание" subtitle="Персональный рацион по профилю и собственные блюда" />
      <View style={styles.grid2}>
        <StatCard theme={theme} title="Калории" value={`${plan.calories || metrics.calories || 0} ккал`} icon="fire" />
        <StatCard theme={theme} title="Белки" value={`${plan.protein || metrics.protein || 0} г`} icon="egg" />
        <StatCard theme={theme} title="Жиры" value={`${plan.fats || metrics.fats || 0} г`} icon="water" />
        <StatCard theme={theme} title="Углеводы" value={`${plan.carbs || metrics.carbs || 0} г`} icon="baguette" />
      </View>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Баланс макронутриентов</Text>
        <MetricBar theme={theme} label="Белки" value={plan.protein || metrics.protein || 0} total={Math.max(1, (plan.protein || 0) + (plan.fats || 0) + (plan.carbs || 0) || metrics.calories)} />
        <MetricBar theme={theme} label="Жиры" value={plan.fats || metrics.fats || 0} total={Math.max(1, (plan.protein || 0) + (plan.fats || 0) + (plan.carbs || 0) || metrics.calories)} />
        <MetricBar theme={theme} label="Углеводы" value={plan.carbs || metrics.carbs || 0} total={Math.max(1, (plan.protein || 0) + (plan.fats || 0) + (plan.carbs || 0) || metrics.calories)} />
      </Card>

      <Card theme={theme}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Рацион на день</Text>
          <Pressable onPress={onRefresh} style={[styles.inlineAction, { borderColor: theme.border, backgroundColor: theme.cardSoft }]}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>Пересчитать</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {items.map((item, index) => (
            <Chip key={`${item.mealType}-${index}`} theme={theme} label={item.mealType} active={selectedIndex === index} onPress={() => setSelectedIndex(index)} />
          ))}
        </ScrollView>

        {items.map((item, index) => (
          <Pressable
            key={`${item.mealType}-${index}-card`}
            onPress={() => setSelectedIndex(index)}
            style={[
              styles.mealCard,
              {
                backgroundColor: selectedIndex === index ? theme.primarySoft : theme.cardSoft,
                borderColor: selectedIndex === index ? theme.primary : theme.border,
              },
            ]}
          >
            <View style={styles.mealCardLeft}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>{item.mealType}</Text>
              <Text style={{ color: theme.muted }}>{item.name}</Text>
              <Text style={{ color: theme.muted }}>{item.note}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: theme.primary, fontWeight: '800' }}>{item.calories} ккал</Text>
              <Text style={{ color: theme.muted, fontSize: 12 }}>
                Б {item.protein} / Ж {item.fats} / У {item.carbs}
              </Text>
            </View>
          </Pressable>
        ))}

        {selectedItem && (
          <View style={[styles.detailBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{selectedItem.mealType}</Text>
            <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 4 }}>{selectedItem.name}</Text>
            <Text style={{ color: theme.muted, marginBottom: 10 }}>{selectedItem.note}</Text>
            <View style={styles.detailMetaRow}>
              <StatusPill theme={theme} text={`${selectedItem.calories} ккал`} tone="accent" />
              <StatusPill theme={theme} text={`Б ${selectedItem.protein}`} tone="neutral" />
              <StatusPill theme={theme} text={`Ж ${selectedItem.fats}`} tone="neutral" />
              <StatusPill theme={theme} text={`У ${selectedItem.carbs}`} tone="neutral" />
            </View>
            <View style={styles.detailMetaRow}>
              <SecondaryButton theme={theme} label="Шаблон в форму" onPress={fillFromPlan} />
            </View>
          </View>
        )}
      </Card>

      <Card theme={theme}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Мои блюда</Text>
          <SecondaryButton theme={theme} label="Новое блюдо" onPress={openCreate} />
        </View>
        <Field
          theme={theme}
          label="Поиск"
          value={query}
          onChangeText={setQuery}
          placeholder="Название, тип, заметка"
        />
        <Text style={{ color: theme.muted, marginBottom: 6 }}>
          Сохранено блюд: {filteredMeals.length}
        </Text>

        {filteredMeals.length ? (
          filteredMeals.map((meal) => (
            <Pressable
              key={String(meal.id)}
              onPress={() => setSelectedMealId(meal.id)}
              style={[
                styles.mealCard,
                {
                  backgroundColor: String(meal.id) === String(selectedMealId) ? theme.primarySoft : theme.cardSoft,
                  borderColor: String(meal.id) === String(selectedMealId) ? theme.primary : theme.border,
                },
              ]}
            >
              <View style={styles.mealCardLeft}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{meal.mealName}</Text>
                <Text style={{ color: theme.muted }}>{meal.mealType}</Text>
                <Text style={{ color: theme.muted, marginTop: 4 }}>{meal.note || 'Без заметки'}</Text>
                <Text style={{ color: theme.muted, marginTop: 4 }}>
                  {meal.calories} ккал • Б {meal.proteins} / Ж {meal.fats} / У {meal.carbs}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ color: theme.primary, fontWeight: '800' }}>{meal.calories} ккал</Text>
                <MiniButton theme={theme} label="Ред." onPress={() => openEdit(meal)} />
                <MiniButton theme={theme} label="Удал." danger onPress={() => removeMeal(meal)} />
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState
            theme={theme}
            icon="food-off-outline"
            title="Список блюд пуст"
            description="Создай первое блюдо или подставь шаблон из плана питания."
            actionLabel="Подставить шаблон"
            onAction={fillFromPlan}
          />
        )}

        {selectedMeal && (
          <View style={[styles.detailBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Детали блюда</Text>
            <Text style={{ color: theme.text, fontWeight: '800' }}>{selectedMeal.mealName}</Text>
            <Text style={{ color: theme.muted, marginTop: 4 }}>{selectedMeal.mealType}</Text>
            <Text style={{ color: theme.muted, marginTop: 4 }}>{selectedMeal.note || 'Без заметки'}</Text>
            <View style={styles.detailMetaRow}>
              <StatusPill theme={theme} text={`${selectedMeal.calories} ккал`} tone="accent" />
              <StatusPill theme={theme} text={`Б ${selectedMeal.proteins}`} tone="neutral" />
              <StatusPill theme={theme} text={`Ж ${selectedMeal.fats}`} tone="neutral" />
              <StatusPill theme={theme} text={`У ${selectedMeal.carbs}`} tone="neutral" />
            </View>
            <View style={styles.detailMetaRow}>
              <SecondaryButton theme={theme} label="Редактировать" onPress={() => openEdit(selectedMeal)} />
              <SecondaryButton theme={theme} label="Удалить" onPress={() => removeMeal(selectedMeal)} />
            </View>
          </View>
        )}
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{editingId ? 'Редактировать блюдо' : 'Создать блюдо'}</Text>
        <Field theme={theme} label="Название блюда" value={form.mealName} onChangeText={(v) => setForm((p) => ({ ...p, mealName: v }))} placeholder="Например, Творог с ягодами" />
        <Field theme={theme} label="Тип приёма пищи" value={form.mealType} onChangeText={(v) => setForm((p) => ({ ...p, mealType: v }))} placeholder="Завтрак / Обед / Ужин" />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Калории" value={form.calories} onChangeText={(v) => setForm((p) => ({ ...p, calories: v }))} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Белки" value={form.proteins} onChangeText={(v) => setForm((p) => ({ ...p, proteins: v }))} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Жиры" value={form.fats} onChangeText={(v) => setForm((p) => ({ ...p, fats: v }))} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Углеводы" value={form.carbs} onChangeText={(v) => setForm((p) => ({ ...p, carbs: v }))} keyboardType="numeric" />
          </View>
        </View>
        <Field theme={theme} label="Заметка" value={form.note} onChangeText={(v) => setForm((p) => ({ ...p, note: v }))} multiline placeholder="Краткое описание" />
        <PrimaryButton theme={theme} label={editingId ? 'Сохранить изменения' : 'Сохранить блюдо'} onPress={submit} />
        {editingId ? <SecondaryButton theme={theme} label="Отменить редактирование" onPress={openCreate} /> : null}
      </Card>

      <Text style={[styles.small, { color: theme.muted }]}>
        {profile ? 'Блюда можно сохранить в backend или локально при отсутствии сети.' : 'Профиль пока не заполнен, показан рекомендуемый рацион.'}
      </Text>
    </ScrollView>
  );
}

function WorkoutsScreen({
  theme,
  profile,
  plan,
  workouts,
  onRefresh,
  onSaveWorkout,
  onDeleteWorkout,
}: {
  theme: ReturnType<typeof getThemeColors>;
  profile: UserProfile | null;
  plan: WorkoutDay[];
  workouts: WorkoutRecord[];
  onRefresh: () => Promise<void>;
  onSaveWorkout: (draft: Partial<WorkoutRecord>, editingId?: string | number | null) => Promise<void>;
  onDeleteWorkout: (id: string | number) => Promise<void>;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | number | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    workoutName: '',
    workoutType: '',
    durationMinutes: '',
    caloriesBurned: '',
    description: '',
  });

  const selectedDay = plan[selectedIndex] || plan[0];
  const totalExercises = plan.reduce((sum, day) => sum + day.exercises.length, 0);
  const estimatedMinutes = Math.max(15, plan.reduce((sum, day) => sum + estimateWorkoutMinutes(day), 0));

  const filteredWorkouts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = [...(workouts || [])];
    list.sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
    if (!normalized) return list;
    return list.filter((workout) =>
      [workout.workoutName, workout.workoutType, workout.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [workouts, query]);

  const selectedWorkout = filteredWorkouts.find((workout) => String(workout.id) === String(selectedWorkoutId)) || filteredWorkouts[0] || null;

  useEffect(() => {
    setSelectedIndex(0);
  }, [plan.length]);

  useEffect(() => {
    if (!selectedWorkoutId && filteredWorkouts.length) {
      setSelectedWorkoutId(filteredWorkouts[0].id);
    }
    if (selectedWorkoutId && !filteredWorkouts.some((workout) => String(workout.id) === String(selectedWorkoutId))) {
      setSelectedWorkoutId(filteredWorkouts[0]?.id || null);
    }
  }, [filteredWorkouts, selectedWorkoutId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      workoutName: '',
      workoutType: '',
      durationMinutes: '',
      caloriesBurned: '',
      description: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setQuery('');
  };

  const openEdit = (workout: WorkoutRecord) => {
    setEditingId(workout.id);
    setForm({
      workoutName: workout.workoutName || '',
      workoutType: workout.workoutType || '',
      durationMinutes: String(workout.durationMinutes ?? ''),
      caloriesBurned: String(workout.caloriesBurned ?? ''),
      description: workout.description || '',
    });
  };

  const fillFromPlan = () => {
    if (!selectedDay) return;
    const description = selectedDay.exercises
      .map((exercise) => `${exercise.name}: ${exercise.sets} x ${exercise.reps}`)
      .join('\\n');
    setEditingId(null);
    setForm({
      workoutName: `${selectedDay.day} — ${selectedDay.focus}`,
      workoutType: selectedDay.focus,
      durationMinutes: String(estimateWorkoutMinutes(selectedDay)),
      caloriesBurned: String(Math.max(120, selectedDay.exercises.length * 65)),
      description,
    });
  };

  const submit = async () => {
    await onSaveWorkout(
      {
        workoutName: form.workoutName,
        workoutType: form.workoutType,
        durationMinutes: Number(form.durationMinutes),
        caloriesBurned: Number(form.caloriesBurned),
        description: form.description,
      },
      editingId,
    );
    openCreate();
  };

  const removeWorkout = (workout: WorkoutRecord) => {
    Alert.alert('Удалить тренировку?', workout.workoutName, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => onDeleteWorkout(workout.id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Header theme={theme} />
      <SectionTitle theme={theme} title="Тренировки" subtitle="Программа занятий по целям, свои планы и редактирование" />
      <View style={styles.grid2}>
        <StatCard theme={theme} title="Дней" value={String(plan.length)} icon="calendar" />
        <StatCard theme={theme} title="Упражнений" value={String(totalExercises)} icon="dumbbell" />
        <StatCard theme={theme} title="Время" value={`${estimatedMinutes} мин`} icon="timer" />
        <StatCard theme={theme} title="Фокус" value={selectedDay?.focus || '—'} icon="lightning-bolt" />
      </View>

      <Card theme={theme}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>План по дням</Text>
          <Pressable onPress={onRefresh} style={[styles.inlineAction, { borderColor: theme.border, backgroundColor: theme.cardSoft }]}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>Пересчитать</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {plan.map((day, index) => (
            <Chip key={`${day.day}-${index}`} theme={theme} label={day.day} active={selectedIndex === index} onPress={() => setSelectedIndex(index)} />
          ))}
        </ScrollView>

        {plan.map((day, index) => (
          <Pressable
            key={`${day.day}-${index}-card`}
            onPress={() => setSelectedIndex(index)}
            style={[
              styles.workoutCard,
              {
                backgroundColor: selectedIndex === index ? theme.primarySoft : theme.cardSoft,
                borderColor: selectedIndex === index ? theme.primary : theme.border,
              },
            ]}
          >
            <View style={styles.mealCardLeft}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>{day.day}</Text>
              <Text style={{ color: theme.muted }}>{day.focus}</Text>
              <Text style={{ color: theme.muted, marginTop: 4 }}>{day.exercises.length} упражнений</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.muted} />
          </Pressable>
        ))}

        {selectedDay && (
          <View style={[styles.detailBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{selectedDay.day}</Text>
            <Text style={{ color: theme.muted, marginBottom: 10 }}>{selectedDay.focus}</Text>
            {selectedDay.exercises.map((exercise, idx) => (
              <View key={`${exercise.name}-${idx}`} style={[styles.exerciseRow, { borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{exercise.name}</Text>
                  <Text style={{ color: theme.muted }}>{exercise.sets} подхода • {exercise.reps}</Text>
                </View>
                <StatusPill theme={theme} text={exercise.reps} tone="neutral" />
              </View>
            ))}
            <View style={styles.detailMetaRow}>
              <StatusPill theme={theme} text={`Сессия: ${estimateWorkoutMinutes(selectedDay)} мин`} tone="accent" />
              <StatusPill theme={theme} text={`Профиль: ${profile ? 'заполнен' : 'пустой'}`} tone={profile ? 'success' : 'warning'} />
            </View>
            <View style={styles.detailMetaRow}>
              <SecondaryButton theme={theme} label="Шаблон в форму" onPress={fillFromPlan} />
            </View>
          </View>
        )}
      </Card>

      <Card theme={theme}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Мои тренировки</Text>
          <SecondaryButton theme={theme} label="Новая тренировка" onPress={openCreate} />
        </View>
        <Field theme={theme} label="Поиск" value={query} onChangeText={setQuery} placeholder="Название, тип, описание" />
        <Text style={{ color: theme.muted, marginBottom: 6 }}>
          Сохранено тренировок: {filteredWorkouts.length}
        </Text>

        {filteredWorkouts.length ? (
          filteredWorkouts.map((workout) => (
            <Pressable
              key={String(workout.id)}
              onPress={() => setSelectedWorkoutId(workout.id)}
              style={[
                styles.workoutCard,
                {
                  backgroundColor: String(workout.id) === String(selectedWorkoutId) ? theme.primarySoft : theme.cardSoft,
                  borderColor: String(workout.id) === String(selectedWorkoutId) ? theme.primary : theme.border,
                },
              ]}
            >
              <View style={styles.mealCardLeft}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{workout.workoutName}</Text>
                <Text style={{ color: theme.muted }}>{workout.workoutType}</Text>
                <Text style={{ color: theme.muted, marginTop: 4 }}>{workout.durationMinutes} мин • {workout.caloriesBurned} ккал</Text>
                <Text style={{ color: theme.muted, marginTop: 4 }}>{workout.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ color: theme.primary, fontWeight: '800' }}>{workout.durationMinutes} мин</Text>
                <MiniButton theme={theme} label="Ред." onPress={() => openEdit(workout)} />
                <MiniButton theme={theme} label="Удал." danger onPress={() => removeWorkout(workout)} />
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState
            theme={theme}
            icon="dumbbell"
            title="Список тренировок пуст"
            description="Создай первую тренировку или собери её из шаблона плана."
            actionLabel="Подставить шаблон"
            onAction={fillFromPlan}
          />
        )}

        {selectedWorkout && (
          <View style={[styles.detailBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Детали тренировки</Text>
            <Text style={{ color: theme.text, fontWeight: '800' }}>{selectedWorkout.workoutName}</Text>
            <Text style={{ color: theme.muted, marginTop: 4 }}>{selectedWorkout.workoutType}</Text>
            <Text style={{ color: theme.muted, marginTop: 4 }}>{selectedWorkout.description}</Text>
            <View style={styles.detailMetaRow}>
              <StatusPill theme={theme} text={`${selectedWorkout.durationMinutes} мин`} tone="accent" />
              <StatusPill theme={theme} text={`${selectedWorkout.caloriesBurned} ккал`} tone="neutral" />
            </View>
            <View style={styles.detailMetaRow}>
              <SecondaryButton theme={theme} label="Редактировать" onPress={() => openEdit(selectedWorkout)} />
              <SecondaryButton theme={theme} label="Удалить" onPress={() => removeWorkout(selectedWorkout)} />
            </View>
          </View>
        )}
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{editingId ? 'Редактировать тренировку' : 'Создать тренировку'}</Text>
        <Field theme={theme} label="Название тренировки" value={form.workoutName} onChangeText={(v) => setForm((p) => ({ ...p, workoutName: v }))} placeholder="Например, Силовая база" />
        <Field theme={theme} label="Тип / фокус" value={form.workoutType} onChangeText={(v) => setForm((p) => ({ ...p, workoutType: v }))} placeholder="Full body / Кардио / Legs" />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Длительность, мин" value={form.durationMinutes} onChangeText={(v) => setForm((p) => ({ ...p, durationMinutes: v }))} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field theme={theme} label="Ккал" value={form.caloriesBurned} onChangeText={(v) => setForm((p) => ({ ...p, caloriesBurned: v }))} keyboardType="numeric" />
          </View>
        </View>
        <Field theme={theme} label="Описание" value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} multiline placeholder="Что входит в тренировку" />
        <PrimaryButton theme={theme} label={editingId ? 'Сохранить изменения' : 'Сохранить тренировку'} onPress={submit} />
        {editingId ? <SecondaryButton theme={theme} label="Отменить редактирование" onPress={openCreate} /> : null}
      </Card>

      <Text style={[styles.small, { color: theme.muted }]}>
        {profile ? 'Тренировки можно сохранить в backend или локально при отсутствии сети.' : 'Профиль пока не заполнен, показан универсальный план.'}
      </Text>
    </ScrollView>
  );
}

function ProgressScreen({
  theme,
  profile,
  entries,
  averageWeight,
  weightDelta,
  onSave,
  onDelete,
}: {
  theme: ReturnType<typeof getThemeColors>;
  profile: UserProfile | null;
  entries: ProgressEntry[];
  averageWeight: number;
  weightDelta: number;
  onSave: (entry: ProgressEntry, editingId?: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [range, setRange] = useState<'7' | '30' | 'all'>('all');
  const [form, setForm] = useState({
    entryDate: new Date().toISOString().slice(0, 10),
    weightKg: '',
    note: '',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => filterProgressEntries(entries, range), [entries, range]);
  const chartEntries = useMemo(() => [...filteredEntries].reverse().slice(0, 8), [filteredEntries]);
  const chartMin = chartEntries.length ? Math.min(...chartEntries.map((entry) => Number(entry.weightKg) || 0)) : 0;
  const chartMax = chartEntries.length ? Math.max(...chartEntries.map((entry) => Number(entry.weightKg) || 0)) : 0;
  const latest = entries[0];
  const selectedEntry = entries.find((entry) => String(entry.id) === String(selectedId)) || latest;

  useEffect(() => {
    if (!selectedId && latest) setSelectedId(latest.id);
  }, [latest, selectedId]);

  const editEntry = (entry: ProgressEntry) => {
    setEditingId(entry.id);
    setForm({
      entryDate: entry.entryDate,
      weightKg: String(entry.weightKg),
      note: entry.note || '',
    });
    setSelectedId(entry.id);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ entryDate: new Date().toISOString().slice(0, 10), weightKg: '', note: '' });
  };

  const quickFill = () => {
    const weight = profile?.weightKg ? String(profile.weightKg) : String(latest?.weightKg || '');
    setForm({
      entryDate: new Date().toISOString().slice(0, 10),
      weightKg: weight,
      note: 'Быстрая запись из профиля',
    });
  };

  const addOrUpdate = async () => {
    if (!form.entryDate || !form.weightKg) {
      Alert.alert('Ошибка', 'Заполни дату и вес.');
      return;
    }
    await onSave(createProgressEntry(form.entryDate, form.weightKg, form.note), editingId);
    resetForm();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Header theme={theme} />
      <SectionTitle theme={theme} title="Прогресс" subtitle="Записи веса и заметки" />
      <View style={styles.grid2}>
        <StatCard theme={theme} title="Средний вес" value={averageWeight ? `${averageWeight} кг` : '—'} icon="scale-bathroom" />
        <StatCard theme={theme} title="Изменение" value={`${weightDelta >= 0 ? '+' : ''}${weightDelta} кг`} icon="trending-up" />
        <StatCard theme={theme} title="Записей" value={String(filteredEntries.length)} icon="notebook-outline" />
        <StatCard theme={theme} title="Фильтр" value={range === 'all' ? 'Все' : range === '7' ? '7 дней' : '30 дней'} icon="filter" />
      </View>

      <Card theme={theme}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>График и фильтр</Text>
          <Pressable onPress={quickFill} style={[styles.inlineAction, { borderColor: theme.border, backgroundColor: theme.cardSoft }]}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>Подставить вес</Text>
          </Pressable>
        </View>
        <View style={styles.filterRow}>
          <Chip theme={theme} label="Все" active={range === 'all'} onPress={() => setRange('all')} />
          <Chip theme={theme} label="7 дней" active={range === '7'} onPress={() => setRange('7')} />
          <Chip theme={theme} label="30 дней" active={range === '30'} onPress={() => setRange('30')} />
        </View>

        {chartEntries.length ? (
          <View style={styles.chartWrap}>
            <View style={styles.chartBars}>
              {chartEntries.map((entry) => {
                const value = Number(entry.weightKg) || 0;
                const normalized = chartMax === chartMin ? 0.7 : (value - chartMin) / Math.max(1, chartMax - chartMin);
                const height = 24 + normalized * 92;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => setSelectedId(String(entry.id))}
                    style={styles.chartBarItem}
                  >
                    <View
                      style={[
                        styles.chartBar,
                        {
                          backgroundColor: String(entry.id) === String(selectedId) ? theme.primary : theme.primarySoft,
                          height,
                        },
                      ]}
                    />
                    <Text style={[styles.chartValue, { color: theme.text }]}>{value.toFixed(1)}</Text>
                    <Text style={[styles.chartLabel, { color: theme.muted }]}>{entry.entryDate.slice(5)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <EmptyState
            theme={theme}
            icon="chart-line-variant"
            title="Нет записей за период"
            description="Измени фильтр или добавь новую запись прогресса."
            actionLabel="Новая запись"
            onAction={quickFill}
          />
        )}
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{editingId ? 'Редактировать запись' : 'Добавить запись'}</Text>
        <Field theme={theme} label="Дата" value={form.entryDate} onChangeText={(v) => setForm((p) => ({ ...p, entryDate: v }))} placeholder="2026-05-16" />
        <Field theme={theme} label="Вес, кг" value={form.weightKg} onChangeText={(v) => setForm((p) => ({ ...p, weightKg: v }))} keyboardType="numeric" />
        <Field theme={theme} label="Заметка" value={form.note} onChangeText={(v) => setForm((p) => ({ ...p, note: v }))} multiline />
        <PrimaryButton theme={theme} label={editingId ? 'Сохранить изменения' : 'Добавить запись'} onPress={addOrUpdate} />
        {editingId && <SecondaryButton theme={theme} label="Отмена" onPress={resetForm} />}
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>История записей</Text>
        {filteredEntries.length ? (
          filteredEntries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => setSelectedId(String(entry.id))}
              style={[
                styles.progressItem,
                {
                  borderColor: String(entry.id) === String(selectedId) ? theme.primary : theme.border,
                  backgroundColor: String(entry.id) === String(selectedId) ? theme.primarySoft : theme.cardSoft,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{entry.entryDate}</Text>
                <Text style={{ color: theme.muted }}>{entry.weightKg} кг</Text>
                {!!entry.note && <Text style={{ color: theme.muted }}>{entry.note}</Text>}
              </View>
              <View style={styles.progressActions}>
                <MiniButton theme={theme} label="Правка" onPress={() => editEntry(entry)} />
                <MiniButton theme={theme} label="Удалить" danger onPress={() => onDelete(entry.id)} />
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={{ color: theme.muted }}>Пока записей нет.</Text>
        )}
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Выбранная запись</Text>
        {selectedEntry ? (
          <>
            <Bullet theme={theme} text={`Дата: ${selectedEntry.entryDate}`} />
            <Bullet theme={theme} text={`Вес: ${selectedEntry.weightKg} кг`} />
            <Bullet theme={theme} text={selectedEntry.note || 'Без заметки'} />
          </>
        ) : (
          <Text style={{ color: theme.muted }}>Нажми на запись выше, чтобы увидеть детали.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

function SettingsScreen({ theme, onResetAll }: { theme: ReturnType<typeof getThemeColors>; onResetAll: () => Promise<void> }) {
  const { apiUrl, setApiUrl, themeMode, onToggleTheme, onLogout, onPing, apiStatus, currentUserLabel, isDemoMode } = useAppContext();
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Header theme={theme} />
      <SectionTitle theme={theme} title="Настройки" subtitle="Подключение к backend и локальные параметры" />
      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Подключение</Text>
        <Field theme={theme} label="API URL" value={apiUrl} onChangeText={setApiUrl} placeholder="http://10.0.2.2:8080" />
        <Text style={[styles.small, { color: theme.muted, marginTop: 4 }]}>
          Для Android-эмулятора обычно используется 10.0.2.2, для физического телефона — IP компьютера.
        </Text>
        <SecondaryButton theme={theme} label="Проверить сервер" onPress={onPing} />
        <Text style={[styles.small, { color: theme.muted, marginTop: 8 }]}>{apiStatus}</Text>
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Внешний вид</Text>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>Тёмная тема</Text>
            <Text style={{ color: theme.muted }}>Фон, карточки и все экраны подстраиваются под тему.</Text>
          </View>
          <Switch value={themeMode === 'dark'} onValueChange={onToggleTheme} />
        </View>
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Состояние профиля</Text>
        <Bullet theme={theme} text={`Пользователь: ${currentUserLabel}`} />
        <Bullet theme={theme} text={`Режим: ${isDemoMode ? 'демо' : 'обычный'}`} />
        <SecondaryButton theme={theme} label="Выйти" onPress={onLogout} />
        <SecondaryButton theme={theme} label="Сбросить локальные данные" onPress={onResetAll} />
      </Card>
    </ScrollView>
  );
}

function SectionTitle({ theme, title, subtitle }: { theme: ReturnType<typeof getThemeColors>; title: string; subtitle: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
    </View>
  );
}

function Card({
  theme,
  children,
}: {
  theme: ReturnType<typeof getThemeColors>;
  children: React.ReactNode;
}) {
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>{children}</View>;
}

function StatCard({
  theme,
  title,
  value,
  icon,
}: {
  theme: ReturnType<typeof getThemeColors>;
  title: string;
  value: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.cardSoft, borderColor: theme.border }]}>
      <View style={styles.statCardTop}>
        <Text style={[styles.small, { color: theme.muted }]}>{title}</Text>
        {icon ? <MaterialCommunityIcons name={icon} size={16} color={theme.primary} /> : null}
      </View>
      <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function QuickAction({
  theme,
  label,
  icon,
  onPress,
}: {
  theme: ReturnType<typeof getThemeColors>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.quickAction, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
      <Ionicons name={icon} size={20} color={theme.text} />
      <Text style={{ color: theme.text, fontWeight: '800', marginTop: 8 }}>{label}</Text>
    </Pressable>
  );
}

function InfoTile({
  theme,
  title,
  body,
  icon,
  onPress,
}: {
  theme: ReturnType<typeof getThemeColors>;
  title: string;
  body: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.infoTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.infoTileIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.primary} />
      </View>
      <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
      <Text style={{ color: theme.muted, marginTop: 6 }} numberOfLines={3}>
        {body}
      </Text>
    </Pressable>
  );
}

function Bullet({ theme, text }: { theme: ReturnType<typeof getThemeColors>; text: string }) {
  return <Text style={{ color: theme.text, marginBottom: 6 }}>• {text}</Text>;
}

function StatusPill({
  theme,
  text,
  tone,
}: {
  theme: ReturnType<typeof getThemeColors>;
  text: string;
  tone: 'neutral' | 'success' | 'warning' | 'accent';
}) {
  const colors = {
    neutral: { backgroundColor: theme.cardSoft, borderColor: theme.border, textColor: theme.text },
    success: { backgroundColor: theme.success + '22', borderColor: theme.success, textColor: theme.success },
    warning: { backgroundColor: theme.warning + '22', borderColor: theme.warning, textColor: theme.warning },
    accent: { backgroundColor: theme.primarySoft, borderColor: theme.primary, textColor: theme.primary },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}>
      <Text style={{ color: colors.textColor, fontSize: 11, fontWeight: '800' }} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function Field({ theme, label, ...props }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
        placeholderTextColor={theme.muted}
      />
    </View>
  );
}

function PrimaryButton({ theme, label, onPress }: { theme: ReturnType<typeof getThemeColors>; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ theme, label, onPress }: { theme: ReturnType<typeof getThemeColors>; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <Text style={{ color: theme.text, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

function MiniButton({
  theme,
  label,
  onPress,
  danger,
}: {
  theme: ReturnType<typeof getThemeColors>;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.smallAction, { borderColor: danger ? theme.danger : theme.border }]}>
      <Text style={{ color: danger ? theme.danger : theme.text, fontWeight: '700', fontSize: 11 }}>{label}</Text>
    </Pressable>
  );
}

function SegmentRow({
  theme,
  left,
  right,
}: {
  theme: ReturnType<typeof getThemeColors>;
  left: { label: string; active: boolean; onPress: () => void };
  right: { label: string; active: boolean; onPress: () => void };
}) {
  return (
    <View style={styles.segmentRow}>
      <SegmentButton theme={theme} {...left} />
      <SegmentButton theme={theme} {...right} />
    </View>
  );
}

function SegmentButton({ theme, label, active, onPress }: { theme: ReturnType<typeof getThemeColors>; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentButton,
        {
          backgroundColor: active ? theme.primary : theme.cardSoft,
          borderColor: active ? theme.primary : theme.border,
        },
      ]}
    >
      <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

function Chip({
  theme,
  label,
  active,
  onPress,
}: {
  theme: ReturnType<typeof getThemeColors>;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.primary : theme.cardSoft,
          borderColor: active ? theme.primary : theme.border,
        },
      ]}
    >
      <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

function MetricBar({
  theme,
  label,
  value,
  total,
}: {
  theme: ReturnType<typeof getThemeColors>;
  label: string;
  value: number;
  total: number;
}) {
  const percent = Math.max(0.06, Math.min(1, total ? value / total : 0));
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHeader}>
        <Text style={{ color: theme.text, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: theme.muted }}>{Math.round(value)}</Text>
      </View>
      <View style={[styles.metricTrack, { backgroundColor: theme.cardSoft, borderColor: theme.border }]}>
        <View style={[styles.metricFill, { width: `${percent * 100}%`, backgroundColor: theme.primary }]} />
      </View>
    </View>
  );
}

function buildShoppingList(items: MealItem[]) {
  const set = new Set<string>();
  for (const item of items || []) {
    const text = `${item.mealType} ${item.name} ${item.note}`.toLowerCase();
    if (text.includes('завтрак') || text.includes('овся') || text.includes('йогурт')) {
      ['Овсяные хлопья', 'Ягоды', 'Греческий йогурт', 'Яйца'].forEach((x) => set.add(x));
    }
    if (text.includes('обед') || text.includes('куриц') || text.includes('греч') || text.includes('рис')) {
      ['Куриная грудка', 'Гречка или рис', 'Свежие овощи'].forEach((x) => set.add(x));
    }
    if (text.includes('ужин') || text.includes('рыб') || text.includes('творог')) {
      ['Рыба или творог', 'Овощи', 'Зелень'].forEach((x) => set.add(x));
    }
    if (text.includes('перекус') || text.includes('снэк') || text.includes('орех')) {
      ['Орехи', 'Фрукты', 'Кефир / протеин'].forEach((x) => set.add(x));
    }
    if (text.includes('после') || text.includes('трен')) {
      ['Бананы', 'Белковый перекус', 'Вода'].forEach((x) => set.add(x));
    }
  }
  return [...set];
}

function estimateWorkoutMinutes(day: WorkoutDay) {
  const exercises = day?.exercises?.length || 0;
  return Math.max(12, 8 + exercises * 8);
}

function filterProgressEntries(entries: ProgressEntry[], range: '7' | '30' | 'all') {
  if (range === 'all') return entries;
  const limit = range === '7' ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - limit);
  return entries.filter((entry) => {
    const parsed = new Date(entry.entryDate);
    return !Number.isNaN(parsed.getTime()) && parsed >= cutoff;
  });
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  full: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  root: { flex: 1, padding: 12, gap: 12 },
  header: {
    margin: 12,
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  headerLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  logoCircle: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  heroIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  headerActions: { alignItems: 'flex-end', gap: 8 },
  themeToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appTitle: { fontSize: 22, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  statCard: {
    flexBasis: '48%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  statCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: { flexBasis: '48%', borderWidth: 1, borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  infoTile: { flexBasis: '48%', borderWidth: 1, borderRadius: 20, padding: 14, minHeight: 130 },
  infoTileIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  listItem: { borderBottomWidth: 1, paddingVertical: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '800' },
  row2: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  primaryButton: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  smallButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  smallAction: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  segmentButton: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10 },
  error: { fontSize: 13, marginBottom: 4, fontWeight: '700' },
  small: { fontSize: 12 },
  scrollContent: { padding: 12, paddingBottom: 34, gap: 12 },
  authWrap: { padding: 16, paddingVertical: 24 },
  settingRow: { marginTop: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  mealCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  mealCardLeft: { flex: 1 },
  workoutCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  detailBox: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 14 },
  detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingVertical: 10 },
  progressItem: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 },
  progressActions: { gap: 8 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  chartWrap: { paddingTop: 6 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, minHeight: 155 },
  chartBarItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 14, minHeight: 24 },
  chartValue: { marginTop: 6, fontSize: 12, fontWeight: '800' },
  chartLabel: { marginTop: 2, fontSize: 11 },
  metricRow: { marginBottom: 10 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metricTrack: { height: 12, borderRadius: 999, overflow: 'hidden', borderWidth: 1 },
  metricFill: { height: '100%', borderRadius: 999 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4 },
  inlineAction: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  analyticsGap: { gap: 10, marginTop: 6 },
  adminUserCard: { gap: 10, marginTop: 0 },
  adminUserTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  roleBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  errorText: { fontSize: 13, marginTop: 6, fontWeight: '700' },
  authMetaCard: { marginTop: 8 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 },
});

export default App;
