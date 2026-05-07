// LeafyGreen design tokens — single source for non-component design values.
//
// Sourced from skill:leafygreen-ui v1.0.0 (params:leafygreen-ui:default) via the
// MongoDB skill graph. Re-exports `palette` and `spacing` for consumer ergonomics
// and adds a `uiTokens` object covering the surface, border, shadow, focus-ring,
// hover-ring, and transition values that aren't components.
//
// Rule of thumb: any inline `style={{ color: '#…' }}` should reach for these
// instead of a raw hex.

import { palette } from "@leafygreen-ui/palette";

export { palette };

// Spacing scale (px) — names match LG token IDs (spacing[200] = 8px, etc.)
export const spacing = {
  0: 0,
  25: 1,
  50: 2,
  100: 4,
  150: 6,
  200: 8,
  300: 12,
  400: 16,
  500: 20,
  600: 24,
  800: 32,
  900: 36,
  1000: 40,
  1200: 48,
  1400: 56,
  1600: 64,
  1800: 72,
};

// Border-radius scale (px)
export const radius = {
  0: 0,
  50: 2,
  100: 4,
  150: 6,
  200: 8,
  300: 12,
  400: 16,
  500: 20,
  600: 24,
};

// Transition durations (ms)
export const transitions = {
  faster: 100,
  default: 150,
  slower: 300,
  slowest: 500,
};

// Light-theme semantic surfaces, borders, text, shadows, focus/hover rings.
// Mirrors the LG light-theme block from the skill graph parameter doc.
export const uiTokens = {
  bg: {
    primary: palette.white,
    secondary: palette.gray.light3, // #F9FBFA
    tertiary: palette.gray.light2,  // #E8EDEB
    inversePrimary: palette.black,  // #001E2B
    info: palette.blue.light3,
    warning: palette.yellow.light3,
    success: palette.green.light3,
    error: palette.red.light3,
    disabled: palette.gray.light2,
  },
  border: {
    primary: palette.gray.base,     // #889397 — for focusable inputs at rest
    secondary: palette.gray.light2, // #E8EDEB — default card / divider border
    success: palette.green.dark1,
    error: palette.red.base,
  },
  text: {
    primary: palette.black,         // #001E2B
    secondary: palette.gray.dark1,  // #5C6C75 — body-text minimum on white
    decorative: palette.gray.base,  // #889397 — never for content text
    disabled: palette.gray.base,
    link: palette.blue.base,        // #016BF8
    success: palette.green.dark2,   // #00684A
    error: palette.red.base,        // #DB3030
    warning: palette.yellow.dark2,  // #944F01
  },
  shadow: {
    1: "0px 2px 4px 1px rgba(0, 30, 43, 0.15)",
    2: "0px 18px 18px -15px rgba(0, 30, 43, 0.20)",
    3: "0px 8px 20px -8px rgba(0, 30, 43, 0.60)",
  },
  focusRing: {
    // skill-spec: TWO rings — white inner + blue.base outer
    default: `0 0 0 2px ${palette.white}, 0 0 0 4px ${palette.blue.base}`,
    input: `0 0 0 3px ${palette.blue.base}`,
  },
  hoverRing: {
    gray: `0 0 0 3px ${palette.gray.light2}`,
    green: `0 0 0 3px ${palette.green.light2}`,
    red: `0 0 0 3px ${palette.red.light2}`,
  },
  transition: {
    fast: `${transitions.faster}ms cubic-bezier(0.33, 1, 0.68, 1)`,
    default: `${transitions.default}ms cubic-bezier(0.33, 1, 0.68, 1)`,
    slower: `${transitions.slower}ms cubic-bezier(0.33, 1, 0.68, 1)`,
  },
};
