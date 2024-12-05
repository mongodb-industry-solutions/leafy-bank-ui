"use client";

/**
 * This file contains the ClientProvider component.
 * It wraps the application with a Redux Provider component.
 * @module ClientProvider
 * @requires react
 * @requires react-redux
 * @requires redux/store
 * @exports ClientProvider
 */

import { Provider } from "react-redux";
import store from "../redux/store";

export default function ClientProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
