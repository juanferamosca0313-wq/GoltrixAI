import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request(endpoint: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('auth_token');
  const headers: Record<string, string> = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}/api${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  register: (data: { email: string; password: string; name: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => request('/auth/me'),

  updateLanguage: (language: string) =>
    request('/auth/language', { method: 'PUT', body: JSON.stringify({ language }) }),

  analyzeVideo: (formData: FormData) =>
    request('/videos/analyze', { method: 'POST', body: formData }),

  getAnalyses: () => request('/analyses'),

  getAnalysis: (id: string) => request(`/analyses/${id}`),

  getProgress: () => request('/progress'),

  getTips: () => request('/tips'),
};
