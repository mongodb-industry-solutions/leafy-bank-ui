// UserSlice.js

import { fetchActiveAccountsForUser } from "@/lib/api/accounts/accounts_api";
import { fetchRecentTransactionsForUser } from "@/lib/api/transactions/transactions_api";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { USER_MAP } from "@/lib/constants";

// Thunk to fetch user data
export const fetchUserData = createAsyncThunk(
  'User/fetchUserData',
  async (userId, { rejectWithValue }) => {
    try {
      const [accounts, transactions] = await Promise.all([
        fetchActiveAccountsForUser(userId),
        fetchRecentTransactionsForUser(userId)
      ]);
      return { accounts, transactions };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const UserSlice = createSlice({
  name: "User",
  initialState: {
    usersList: Object.entries(USER_MAP).map(([id, name]) => ({ id, name })),
    selectedUser: null,
    loading: true,
    error: null,
    accounts: {
      loading: true,
      error: null,
      list: [],
      initialLoad: false,
      updateToggle: false
    },
    transactions: {
      loading: true,
      error: null,
      list: [],
      initialLoad: false,
      updateToggle: false
    }
  },
  reducers: {
    setUsersList: (state, action) => {
      return { ...state, usersList: [...action.payload] }
    },
    setSelectedUser: (state, action) => {
      return { ...state, selectedUser: { ...action.payload } }
    },
    setLoadingUsersList: (state, action) => {
      return { ...state, loading: action.payload }
    },
    setErrorUsersList: (state, action) => {
      return { ...state, error: action.payload ? { ...action.payload } : null }
    },
    setAccountsList: (state, action) => {
      return { ...state, accounts: { ...state.accounts, list: action.payload, loading: false } }
    },
    setTransactionsList: (state, action) => {
      return { ...state, transactions: { ...state.transactions, list: action.payload, loading: false } }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.accounts.loading = false;
        state.accounts.list = action.payload.accounts;
        state.accounts.initialLoad = true;
        state.transactions.loading = false;
        state.transactions.list = action.payload.transactions;
        state.transactions.initialLoad = true;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.accounts.loading = false;
        state.accounts.error = action.payload;
        state.transactions.loading = false;
        state.transactions.error = action.payload;
      });
  },
});

export const {
  setUsersList,
  setSelectedUser,
  setLoadingUsersList,
  setErrorUsersList,
  setAccountsList,
  setTransactionsList
} = UserSlice.actions;

export default UserSlice.reducer;
