// motionConfig.js — shared springs and motion presets.
// One source of truth so every animated surface in LedgerFlow speaks the
// same physical language.

// Default spring — used wherever we say `transition: SPRING.default`.
// Tone: snappy, settled, not bouncy.
export const SPRING = {
  default:  { type: "spring", stiffness: 220, damping: 28, mass: 1 },
  // Hero moments only (journal commit, equilibrium lock).
  hero:     { type: "spring", stiffness: 140, damping: 22, mass: 1 },
  // Numerical ticker — slower physics so balance numerals settle visibly.
  numeral:  { stiffness: 80, damping: 22, mass: 1 },
  // Tap / press — brief and stiff.
  tap:      { type: "spring", stiffness: 320, damping: 30 },
  // Layout — for shared-element transitions (the active pill, document slot).
  layout:   { type: "spring", stiffness: 260, damping: 30 },
};

// Stage-to-stage interpreter transition.
export const STAGE_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: SPRING.default,
};

// Card mount stagger inside lists (collection drawer, etc.)
export const STAGGER = {
  parent: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
  child:  {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    transition: SPRING.default,
  },
};
