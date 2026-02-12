import { createSlice } from '@reduxjs/toolkit';
import type { User } from '@/app/types';

const AUTH_KEY = 'ticketing_auth';

function loadStored(): { user: User | null; token: string | null } {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { user: null, token: null };
    const data = JSON.parse(raw) as { user?: User; token?: string };
    return { user: data.user ?? null, token: data.token ?? null };
  } catch {
    return { user: null, token: null };
  }
}

function saveStored(user: User | null, token: string | null) {
  try {
    if (token) localStorage.setItem(AUTH_KEY, JSON.stringify({ user, token }));
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore
  }
}

const stored = loadStored();

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored.user as User | null,
    token: stored.token as string | null,
  },
  reducers: {
    setCredentials: (state, action: { payload: { user: User; token: string } }) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      saveStored(state.user, state.token);
    },
    setUser: (state, action: { payload: User }) => {
      state.user = action.payload;
      if (state.token) saveStored(state.user, state.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      saveStored(null, null);
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export const selectCurrentUser = (state: { auth: { user: User | null } }) => state.auth.user;
export const selectToken = (state: { auth: { token: string | null } }) => state.auth.token;
