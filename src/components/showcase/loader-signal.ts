"use client";

// Tiny signal: the R3F scene marks itself ready after its first rendered
// frame (shader compile done). The loader gates on this + drei useProgress.

let ready = false;
const subs = new Set<() => void>();

export function markSceneReady() {
  if (ready) return;
  ready = true;
  subs.forEach((fn) => fn());
  subs.clear();
}

export function isSceneReady() {
  return ready;
}

export function onSceneReady(fn: () => void) {
  if (ready) {
    fn();
    return () => {};
  }
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
