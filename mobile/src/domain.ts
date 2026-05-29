declare const process: { env?: Record<string, string | undefined> } | undefined;

function normalizeApiUrl(value: string | undefined, fallback: string) {
  const raw = (value || '').trim();
  if (!raw) return fallback;

  const withoutSlash = raw.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(withoutSlash)) {
    return withoutSlash;
  }

  const localHostPattern = /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$/i;
  return `${localHostPattern.test(withoutSlash) ? 'http' : 'https'}://${withoutSlash}`;
}

export const defaultApiUrl = normalizeApiUrl(process?.env?.EXPO_PUBLIC_API_URL, 'http://10.0.2.2:8080');

export function createDemoProfile() {
  return {
    fullName: 'Демонстрационный пользователь',
    age: 24,
    sex: 'female',
    heightCm: 168,
    weightKg: 62,
    activity: 'moderate',
    goal: 'maintain',
    trainingDays: 3,
    allergies: '',
    notes: 'Локальный режим без подключения к серверу.',
    updatedAt: new Date().toISOString(),
  };
}

export function createDemoProgress() {
  const today = new Date();
  const d1 = new Date(today);
  d1.setDate(d1.getDate() - 14);
  const d2 = new Date(today);
  d2.setDate(d2.getDate() - 7);
  return [
    { id: 'p1', entryDate: d1.toISOString().slice(0, 10), weightKg: 62.8, note: 'Стартовая запись' },
    { id: 'p2', entryDate: d2.toISOString().slice(0, 10), weightKg: 62.1, note: 'Небольшой прогресс' },
  ];
}


export function createDemoMeals() {
  return [
    {
      id: 'm1',
      mealName: 'Овсянка с бананом',
      mealType: 'Завтрак',
      calories: 420,
      proteins: 18,
      fats: 11,
      carbs: 64,
      note: 'Хороший старт дня с медленными углеводами и белком.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'm2',
      mealName: 'Курица с рисом и овощами',
      mealType: 'Обед',
      calories: 610,
      proteins: 42,
      fats: 18,
      carbs: 62,
      note: 'Сбалансированный обед для восстановления.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function createDemoWorkouts() {
  return [
    {
      id: 'w1',
      workoutName: 'Силовая база',
      workoutType: 'Full body',
      durationMinutes: 45,
      caloriesBurned: 320,
      description: 'Базовая тренировка на всё тело с упором на технику.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'w2',
      workoutName: 'Кардио + кор',
      workoutType: 'Conditioning',
      durationMinutes: 35,
      caloriesBurned: 280,
      description: 'Интервальная работа для выносливости и кора.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}


export function createInitialState() {
  return {
    apiUrl: defaultApiUrl,
    token: null,
    currentUser: null,
    profile: null,
    nutritionPlan: null,
    workoutPlan: null,
    progress: createDemoProgress(),
    meals: createDemoMeals(),
    workouts: createDemoWorkouts(),
    theme: 'dark',
    isDemoMode: false,
  };
}

export function getThemeColors(theme) {
  const light = {
    bg: '#f8fafc',
    card: '#ffffff',
    cardSoft: '#eef2ff',
    text: '#0f172a',
    muted: '#475569',
    border: '#cbd5e1',
    primary: '#2563eb',
    primarySoft: '#dbeafe',
    success: '#15803d',
    danger: '#dc2626',
    warning: '#d97706',
    input: '#ffffff',
    shadow: 'rgba(15, 23, 42, 0.08)',
    chip: '#e2e8f0',
  };

  const dark = {
    bg: '#0f172a',
    card: '#111827',
    cardSoft: '#1e293b',
    text: '#e2e8f0',
    muted: '#94a3b8',
    border: '#334155',
    primary: '#60a5fa',
    primarySoft: '#1d4ed8',
    success: '#4ade80',
    danger: '#f87171',
    warning: '#fbbf24',
    input: '#0b1220',
    shadow: 'rgba(0, 0, 0, 0.28)',
    chip: '#1f2937',
  };

  return theme === 'dark' ? dark : light;
}

export function calculateMetrics(profile) {
  if (!profile) {
    return {
      bmi: 0,
      bmr: 0,
      tdee: 0,
      calories: 0,
      protein: 0,
      fats: 0,
      carbs: 0,
      weightGoalText: 'Заполните профиль',
    };
  }

  const sexOffset = profile.sex === 'male' ? 5 : -161;
  const activityFactor = {
    low: 1.2,
    moderate: 1.45,
    high: 1.7,
  }[profile.activity || 'moderate'];

  const weight = Number(profile.weightKg) || 0;
  const height = Number(profile.heightCm) || 0;
  const age = Number(profile.age) || 0;
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + sexOffset);
  const tdee = Math.round(bmr * activityFactor);

  const goalAdjustment = {
    lose_weight: -350,
    maintain: 0,
    gain_muscle: 250,
  }[profile.goal || 'maintain'];

  const calories = Math.max(1400, tdee + goalAdjustment);
  const protein = Math.round(weight * (profile.goal === 'gain_muscle' ? 1.8 : 1.6));
  const fats = Math.round(weight * 0.9);
  const carbs = Math.max(80, Math.round((calories - protein * 4 - fats * 9) / 4));
  const bmi = height ? Number((weight / Math.pow(height / 100, 2)).toFixed(1)) : 0;

  const weightGoalText = {
    lose_weight: 'Снижение веса',
    maintain: 'Поддержание формы',
    gain_muscle: 'Набор мышечной массы',
  }[profile.goal || 'maintain'];

  return { bmi, bmr, tdee, calories, protein, fats, carbs, weightGoalText };
}

export function buildMealPlan(profile) {
  const metrics = calculateMetrics(profile);
  if (!profile) {
    return {
      calories: 0,
      protein: 0,
      fats: 0,
      carbs: 0,
      items: [
        {
          mealType: 'План питания',
          name: 'Заполните профиль',
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          note: 'После заполнения данных появятся рекомендации.',
        },
      ],
    };
  }

  const items = {
    lose_weight: [
      ['Завтрак', 'Овсянка с ягодами и йогуртом', 'Белки и сложные углеводы для мягкого дефицита'],
      ['Обед', 'Куриная грудка с гречкой и салатом', 'Сытный обед без лишних калорий'],
      ['Перекус', 'Творог и яблоко', 'Лёгкий перекус между приёмами пищи'],
      ['Ужин', 'Лосось с овощами на пару', 'Белок и полезные жиры'],
      ['Перед сном', 'Кефир и орехи', 'Небольшой приём пищи перед сном'],
    ],
    maintain: [
      ['Завтрак', 'Омлет с овощами и цельнозерновым тостом', 'Баланс белков и углеводов'],
      ['Обед', 'Индейка с рисом и салатом', 'Основной приём пищи для стабильного режима'],
      ['Перекус', 'Йогурт, банан и немного орехов', 'Лёгкий перекус'],
      ['Ужин', 'Рыба с картофелем и брокколи', 'Сытный ужин'],
      ['Перед сном', 'Творог с ягодами', 'Лёгкий вечерний вариант'],
    ],
    gain_muscle: [
      ['Завтрак', 'Овсянка с бананом, яйцом и арахисовой пастой', 'Завтрак с повышенной калорийностью'],
      ['Обед', 'Паста с курицей и овощами', 'Плотный обед для восстановления'],
      ['Перекус', 'Протеиновый перекус с фруктом', 'Дополнительные калории между приёмами пищи'],
      ['Ужин', 'Говядина с рисом и овощами', 'Ужин для набора массы'],
      ['Перед сном', 'Сырники с йогуртом', 'Дополнительный белок перед сном'],
    ],
  }[profile.goal || 'maintain'];

  const portions = [0.25, 0.3, 0.1, 0.25, 0.1];
  return {
    calories: metrics.calories,
    protein: metrics.protein,
    fats: metrics.fats,
    carbs: metrics.carbs,
    items: items.map((row, index) => {
      const [mealType, name, note] = row;
      return {
        mealType,
        name,
        calories: Math.round(metrics.calories * portions[index]),
        protein: Math.round(metrics.protein * portions[index]),
        carbs: Math.round(metrics.carbs * portions[index]),
        fats: Math.max(5, Math.round(metrics.fats * portions[index])),
        note,
      };
    }),
  };
}

export function buildWorkoutPlan(profile) {
  if (!profile) {
    return [
      {
        day: 'План тренировок',
        focus: 'Заполните профиль',
        exercises: [{ name: 'После заполнения профиля здесь появится готовая программа', sets: '—', reps: '—' }],
      },
    ];
  }

  const goal = profile.goal || 'maintain';
  const library = {
    lose_weight: [
      {
        day: 'День 1',
        focus: 'Кардио + всё тело',
        exercises: [
          { name: 'Разминка на дорожке', sets: '1', reps: '10 мин' },
          { name: 'Приседания', sets: '3', reps: '15' },
          { name: 'Отжимания', sets: '3', reps: '12' },
          { name: 'Планка', sets: '3', reps: '30 сек' },
        ],
      },
      {
        day: 'День 2',
        focus: 'Низ тела + пресс',
        exercises: [
          { name: 'Выпады', sets: '3', reps: '12 на ногу' },
          { name: 'Ягодичный мост', sets: '3', reps: '15' },
          { name: 'Скручивания', sets: '3', reps: '20' },
          { name: 'Велосипед', sets: '3', reps: '30 сек' },
        ],
      },
      {
        day: 'День 3',
        focus: 'Интервалы',
        exercises: [
          { name: 'Бег на месте', sets: '6', reps: '45 сек' },
          { name: 'Берпи', sets: '4', reps: '10' },
          { name: 'Альпинист', sets: '4', reps: '20' },
          { name: 'Растяжка', sets: '1', reps: '8 мин' },
        ],
      },
    ],
    maintain: [
      {
        day: 'День 1',
        focus: 'Силовая база',
        exercises: [
          { name: 'Приседания', sets: '3', reps: '12' },
          { name: 'Жим от пола', sets: '3', reps: '12' },
          { name: 'Тяга резинки', sets: '3', reps: '15' },
          { name: 'Планка', sets: '3', reps: '40 сек' },
        ],
      },
      {
        day: 'День 2',
        focus: 'Кардио и кор',
        exercises: [
          { name: 'Ходьба/бег', sets: '1', reps: '20 мин' },
          { name: 'Скручивания', sets: '3', reps: '20' },
          { name: 'Мостик', sets: '3', reps: '15' },
          { name: 'Растяжка', sets: '1', reps: '8 мин' },
        ],
      },
      {
        day: 'День 3',
        focus: 'Тонус мышц',
        exercises: [
          { name: 'Выпады', sets: '3', reps: '10 на ногу' },
          { name: 'Жим гантелей', sets: '3', reps: '12' },
          { name: 'Тяга в наклоне', sets: '3', reps: '12' },
          { name: 'Планка боковая', sets: '3', reps: '25 сек' },
        ],
      },
    ],
    gain_muscle: [
      {
        day: 'День 1',
        focus: 'Грудь + трицепс',
        exercises: [
          { name: 'Жим лёжа', sets: '4', reps: '8' },
          { name: 'Отжимания на брусьях', sets: '4', reps: '8' },
          { name: 'Разведения гантелей', sets: '3', reps: '12' },
          { name: 'Французский жим', sets: '3', reps: '10' },
        ],
      },
      {
        day: 'День 2',
        focus: 'Спина + бицепс',
        exercises: [
          { name: 'Тяга штанги', sets: '4', reps: '8' },
          { name: 'Подтягивания', sets: '4', reps: 'макс' },
          { name: 'Сгибания на бицепс', sets: '3', reps: '10' },
          { name: 'Гиперэкстензия', sets: '3', reps: '15' },
        ],
      },
      {
        day: 'День 3',
        focus: 'Ноги + плечи',
        exercises: [
          { name: 'Приседания со штангой', sets: '4', reps: '8' },
          { name: 'Жим гантелей вверх', sets: '4', reps: '10' },
          { name: 'Выпады', sets: '3', reps: '12' },
          { name: 'Подъёмы на икры', sets: '4', reps: '15' },
        ],
      },
    ],
  }[goal];

  return library.slice(0, Math.max(3, Math.min(Number(profile.trainingDays) || 3, 5)));
}

export function sortProgressEntries(entries) {
  return [...(entries || [])].sort((a, b) => String(b.entryDate).localeCompare(String(a.entryDate)));
}

export function getAverageWeight(entries) {
  if (!entries || !entries.length) return 0;
  const total = entries.reduce((sum, item) => sum + (Number(item.weightKg) || 0), 0);
  return Number((total / entries.length).toFixed(1));
}

export function getWeightChange(entries) {
  if (!entries || entries.length < 2) return 0;
  const sorted = [...entries].sort((a, b) => String(a.entryDate).localeCompare(String(b.entryDate)));
  const first = Number(sorted[0].weightKg) || 0;
  const last = Number(sorted[sorted.length - 1].weightKg) || 0;
  return Number((last - first).toFixed(1));
}

export function createProgressEntry(date, weightKg, note) {
  return {
    id: `p-${Date.now()}`,
    entryDate: date,
    weightKg: Number(weightKg),
    note: note || '',
  };
}


export function getCheckInStreak(entries) {
  if (!entries || entries.length === 0) return 0;
  const sorted = [...entries].sort((a, b) => String(b.entryDate).localeCompare(String(a.entryDate)));
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = new Date(sorted[i].entryDate);
    const next = new Date(sorted[i + 1].entryDate);
    const diffDays = Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 8) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
