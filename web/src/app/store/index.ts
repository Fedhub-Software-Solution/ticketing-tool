import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './slices/authSlice';
import { baseApi } from './apis/baseApi';
import './apis/authApi';
import './apis/ticketsApi';
import './apis/usersApi';
import './apis/slasApi';
import './apis/categoriesApi';
import './apis/escalationRulesApi';
import './apis/zonesApi';
import './apis/branchesApi';
import './apis/enterpriseApi';
import './apis/reportsApi';
import './apis/rolesApi';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
