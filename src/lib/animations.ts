/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ZenScan AI Premium Animation System
 * Core durations and easing curves for a cohesive motion language.
 */

export const DURATIONS = {
  ULTRA_FAST: 0.12,
  FAST: 0.18,
  NORMAL: 0.25,
  PREMIUM: 0.4,
  CINEMATIC: 0.7,
};

export const EASINGS = {
  // Main Curve: cubic-bezier(0.4, 0, 0.2, 1)
  MAIN: [0.4, 0, 0.2, 1],
  
  // Premium Curve: cubic-bezier(0.22, 1, 0.36, 1)
  PREMIUM: [0.22, 1, 0.36, 1],
  
  // Spring Curve equivalent for easeOutBack
  SPRING: [0.34, 1.56, 0.64, 1],
  
  // Smooth reveal
  QUART_OUT: [0.25, 1, 0.5, 1],
};

export const STAGGER = {
  STANDARD: 0.08,
  FLOW: 0.15,
};

/**
 * Standard transition objects for motion components
 */
export const TRANSITIONS = {
  MAIN: {
    duration: DURATIONS.NORMAL,
    ease: EASINGS.MAIN,
  },
  PREMIUM: {
    duration: DURATIONS.PREMIUM,
    ease: EASINGS.PREMIUM,
  },
  SPRING: {
    type: "spring",
    damping: 25,
    stiffness: 200,
  },
};
