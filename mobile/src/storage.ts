import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDemoProgress, createInitialState } from './domain';

const SNAPSHOT_KEY = 'nutrition_coach_state_v3';
const PROFILE_KEY = 'nutrition_coach_profile_v1';
const NUTRITION_KEY = 'nutrition_coach_nutrition_v1';
const WORKOUT_KEY = 'nutrition_coach_workout_v1';
const PROGRESS_KEY = 'nutrition_coach_progress_v1';
const MEALS_KEY = 'nutrition_coach_meals_v1';
const WORKOUTS_KEY = 'nutrition_coach_workouts_v1';
const META_KEY = 'nutrition_coach_meta_v1';

function safeParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeState(raw) {
  const fallback = createInitialState();
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  return {
    apiUrl: typeof raw.apiUrl === 'string' && raw.apiUrl.trim() ? raw.apiUrl : fallback.apiUrl,
    token: typeof raw.token === 'string' && raw.token.trim() ? raw.token : null,
    currentUser: raw.currentUser && typeof raw.currentUser === 'object' ? raw.currentUser : null,
    profile: raw.profile && typeof raw.profile === 'object' ? raw.profile : null,
    nutritionPlan: raw.nutritionPlan && typeof raw.nutritionPlan === 'object' ? raw.nutritionPlan : null,
    workoutPlan: Array.isArray(raw.workoutPlan) ? raw.workoutPlan : null,
    progress: Array.isArray(raw.progress) ? raw.progress : fallback.progress,
    meals: Array.isArray(raw.meals) ? raw.meals : fallback.meals,
    workouts: Array.isArray(raw.workouts) ? raw.workouts : fallback.workouts,
    theme: raw.theme === 'light' ? 'light' : 'dark',
    isDemoMode: Boolean(raw.isDemoMode),
  };
}

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? safeParse(raw, fallback) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadState() {
  try {
    const snapshotRaw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (snapshotRaw) {
      return normalizeState(safeParse(snapshotRaw, createInitialState()));
    }

    const fallback = createInitialState();
    const [profile, nutritionPlan, workoutPlan, progress, meals, workouts, meta] = await Promise.all([
      readJson(PROFILE_KEY, fallback.profile),
      readJson(NUTRITION_KEY, fallback.nutritionPlan),
      readJson(WORKOUT_KEY, fallback.workoutPlan),
      readJson(PROGRESS_KEY, fallback.progress),
      readJson(MEALS_KEY, fallback.meals),
      readJson(WORKOUTS_KEY, fallback.workouts),
      readJson(META_KEY, {}),
    ]);

    return normalizeState({
      ...fallback,
      apiUrl: meta.apiUrl || fallback.apiUrl,
      token: meta.token || null,
      currentUser: meta.currentUser || null,
      theme: meta.theme === 'light' ? 'light' : 'dark',
      isDemoMode: Boolean(meta.isDemoMode),
      profile,
      nutritionPlan,
      workoutPlan,
      progress: Array.isArray(progress) && progress.length ? progress : createDemoProgress(),
      meals: Array.isArray(meals) ? meals : fallback.meals,
      workouts: Array.isArray(workouts) ? workouts : fallback.workouts,
    });
  } catch (error) {
    console.warn('Failed to load cached data', error);
    return createInitialState();
  }
}

export async function saveState(state) {
  try {
    const snapshot = normalizeState(state);
    const meta = {
      apiUrl: snapshot.apiUrl,
      token: snapshot.token,
      currentUser: snapshot.currentUser,
      theme: snapshot.theme,
      isDemoMode: snapshot.isDemoMode,
      lastSavedAt: new Date().toISOString(),
    };

    await Promise.all([
      writeJson(SNAPSHOT_KEY, snapshot),
      writeJson(PROFILE_KEY, snapshot.profile),
      writeJson(NUTRITION_KEY, snapshot.nutritionPlan),
      writeJson(WORKOUT_KEY, snapshot.workoutPlan),
      writeJson(PROGRESS_KEY, snapshot.progress),
      writeJson(MEALS_KEY, snapshot.meals),
      writeJson(WORKOUTS_KEY, snapshot.workouts),
      writeJson(META_KEY, meta),
    ]);
  } catch (error) {
    console.warn('Failed to save cached data', error);
  }
}

export async function clearState() {
  try {
    await Promise.all([
      AsyncStorage.removeItem(SNAPSHOT_KEY),
      AsyncStorage.removeItem(PROFILE_KEY),
      AsyncStorage.removeItem(NUTRITION_KEY),
      AsyncStorage.removeItem(WORKOUT_KEY),
      AsyncStorage.removeItem(PROGRESS_KEY),
      AsyncStorage.removeItem(MEALS_KEY),
      AsyncStorage.removeItem(WORKOUTS_KEY),
      AsyncStorage.removeItem(META_KEY),
    ]);
  } catch (error) {
    console.warn('Failed to clear cached data', error);
  }
}
