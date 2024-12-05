// store.js
/**
 * This file contains the Redux store configuration.
 * It includes the user reducer.
 * @module store
 * @requires reduxjs/toolkit
 * @requires slices/UserSlice
 * @exports store
 * @example import store from './store';
 */

import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/UserSlice';

const store = configureStore({
  reducer: {
    User: userReducer,
  },
});
export default store;