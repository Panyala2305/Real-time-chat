// Redux Toolkit "slice" = a piece of global state + its reducers + actions
// authSlice manages: who is logged in, loading states, errors

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async action: register
export const register = createAsyncThunk('auth/register', async (data, thunkAPI) => {
  try {
    const res = await api.post('/auth/register', data);
    return res.data.user;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

// Async action: login
export const login = createAsyncThunk('auth/login', async (data, thunkAPI) => {
  try {
    const res = await api.post('/auth/login', data);
    return res.data.user;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

// Async action: logout
export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

// Async action: get current user (on app load)
export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, thunkAPI) => {
  try {
    const res = await api.get('/auth/me');
    return res.data.user;
  } catch {
    return thunkAPI.rejectWithValue(null);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    initialized: false, // Has the app checked if user is logged in?
  },
  reducers: {
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Login
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Logout
      .addCase(logout.fulfilled, (state) => { state.user = null; })
      // Fetch me
      .addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload; state.initialized = true; })
      .addCase(fetchMe.rejected, (state) => { state.initialized = true; })
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;