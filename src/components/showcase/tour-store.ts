"use client";

// Tiny shared flags for tour mode (T-317) + the finale real-cursor sync
// guard (T-314). Module-level mutable state, same pattern as sync-store.
export const tourState = {
  /** ?tour=1 take in progress — input locked, signature interaction off. */
  active: false,
  /** Loader finished (Loader onDone) — the tour waits on this. */
  loaderDone: false,
};
