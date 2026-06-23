import axios from 'axios';

function normalizeBaseUrl(baseURL) {
  const raw = (baseURL || '').trim();

  if (!raw) {
    return 'http://10.0.2.2:8080';
  }

  const withoutSlash = raw.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(withoutSlash)) {
    return withoutSlash;
  }

  const localHostPattern = /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$/i;
  return `${localHostPattern.test(withoutSlash) ? 'http' : 'https'}://${withoutSlash}`;
}

function makeClient(baseURL, token) {
  return axios.create({
    baseURL: normalizeBaseUrl(baseURL),
    timeout: 10000,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function apiHealth(baseURL) {
  const client = makeClient(baseURL);
  const { data } = await client.get('/api/health');
  return data;
}

export async function apiRegister(baseURL, payload) {
  const client = makeClient(baseURL);
  const { data } = await client.post('/api/auth/register', payload);
  return data;
}

export async function apiLogin(baseURL, payload) {
  const client = makeClient(baseURL);
  const { data } = await client.post('/api/auth/login', payload);
  return data;
}

export async function apiGetMe(baseURL, token) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/profile/me');
  return data;
}

export async function apiSaveProfile(baseURL, token, payload) {
  const client = makeClient(baseURL, token);
  const { data } = await client.put('/api/profile/me', payload);
  return data;
}

export async function apiGetNutritionPlan(baseURL, token) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/nutrition/plan');
  return data;
}

export async function apiGetWorkoutPlan(baseURL, token) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/workouts/plan');
  return data;
}

export async function apiGetProgress(baseURL, token) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/progress');
  return data;
}

export async function apiCreateProgress(baseURL, token, payload) {
  const client = makeClient(baseURL, token);
  const { data } = await client.post('/api/progress', payload);
  return data;
}

export async function apiUpdateProgress(baseURL, token, id, payload) {
  const client = makeClient(baseURL, token);
  const { data } = await client.put(`/api/progress/${id}`, payload);
  return data;
}

export async function apiGetProgressById(baseURL, token, id) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get(`/api/progress/${id}`);
  return data;
}

export async function apiSearchProgress(baseURL, token, params = {}) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/progress/search', { params });
  return data;
}

export async function apiDeleteProgress(baseURL, token, id) {
  const client = makeClient(baseURL, token);
  const { data } = await client.delete(`/api/progress/${id}`);
  return data;
}

export async function apiGetDashboard(baseURL, token) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/dashboard/summary');
  return data;
}


export async function apiGetMeals(baseURL, token) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/meals');
  return data;
}

export async function apiGetMealById(baseURL, token, id) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get(`/api/meals/${id}`);
  return data;
}

export async function apiSearchMeals(baseURL, token, query = '') {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/meals/search', { params: { query } });
  return data;
}

export async function apiCreateMeal(baseURL, token, payload) {
  const client = makeClient(baseURL, token);
  const { data } = await client.post('/api/meals', payload);
  return data;
}

export async function apiUpdateMeal(baseURL, token, id, payload) {
  const client = makeClient(baseURL, token);
  const { data } = await client.put(`/api/meals/${id}`, payload);
  return data;
}

export async function apiDeleteMeal(baseURL, token, id) {
  const client = makeClient(baseURL, token);
  const { data } = await client.delete(`/api/meals/${id}`);
  return data;
}

export async function apiGetWorkouts(baseURL, token) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/workout-plans');
  return data;
}

export async function apiGetWorkoutById(baseURL, token, id) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get(`/api/workout-plans/${id}`);
  return data;
}

export async function apiSearchWorkouts(baseURL, token, query = '') {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/workout-plans/search', { params: { query } });
  return data;
}

export async function apiCreateWorkout(baseURL, token, payload) {
  const client = makeClient(baseURL, token);
  const { data } = await client.post('/api/workout-plans', payload);
  return data;
}

export async function apiUpdateWorkout(baseURL, token, id, payload) {
  const client = makeClient(baseURL, token);
  const { data } = await client.put(`/api/workout-plans/${id}`, payload);
  return data;
}

export async function apiDeleteWorkout(baseURL, token, id) {
  const client = makeClient(baseURL, token);
  const { data } = await client.delete(`/api/workout-plans/${id}`);
  return data;
}


export async function apiGetAdminUsers(baseURL, token) {
  const client = makeClient(baseURL, token);
  const { data } = await client.get('/api/admin/users');
  return data;
}
