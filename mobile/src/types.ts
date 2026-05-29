export type ThemeMode = 'dark' | 'light';
export type Sex = 'male' | 'female';
export type ActivityLevel = 'low' | 'moderate' | 'high';
export type Goal = 'lose_weight' | 'maintain' | 'gain_muscle';

export interface UserProfile {
  fullName: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  trainingDays: number;
  allergies: string;
  notes: string;
  updatedAt: string;
}

export interface ProgressEntry {
  id: string;
  entryDate: string;
  weightKg: number;
  note: string;
}

export interface MealItem {
  mealType: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  note: string;
}

export interface MealPlan {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  items: MealItem[];
}

export interface WorkoutExercise {
  name: string;
  sets: string;
  reps: string;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  days: WorkoutDay[];
}


export interface MealRecord {
  id: string | number;
  mealName: string;
  mealType: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutRecord {
  id: string | number;
  workoutName: string;
  workoutType: string;
  durationMinutes: number;
  caloriesBurned: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string | number;
  email: string;
  fullName: string;
  role: string;
}

export interface Metrics {
  bmi: number;
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  weightGoalText: string;
}

export interface AppState {
  apiUrl: string;
  token: string | null;
  currentUser: { email: string; fullName: string; role?: string; id?: number } | null;
  profile: UserProfile | null;
  nutritionPlan: MealPlan | null;
  workoutPlan: WorkoutPlan | null;
  progress: ProgressEntry[];
  meals: MealRecord[];
  workouts: WorkoutRecord[];
  theme: ThemeMode;
  isDemoMode: boolean;
}
