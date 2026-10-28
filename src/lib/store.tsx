"use client";
import { useEffect, useSyncExternalStore } from "react";
import { STORAGE_KEY } from "./config";
import { createSeed } from "./fixtures";
import { DemoError, execute, type Command } from "./repository";
import { parseStored } from "./storage";
import type { AppState } from "./types";

let state: AppState | null = null;
let persistenceNotice = "";
let lastPersisted: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
function hydrate() {
  if (state) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    lastPersisted = raw;
    state = raw ? parseStored(raw) : createSeed();
    if (!raw) {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
      lastPersisted = serialized;
    }
  } catch {
    state = createSeed();
    persistenceNotice =
      "Saved demo data could not be loaded. Fresh fixtures are active. Browser storage may be unavailable; changes may last only in this tab.";
  }
  emit();
}
function save(next: AppState) {
  state = next;
  try {
    const serialized = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, serialized);
    lastPersisted = serialized;
    persistenceNotice = "";
  } catch {
    persistenceNotice =
      "Browser storage is unavailable. Changes work in this tab but may be lost on reload.";
  }
  emit();
}
export function useDemoStore() {
  const current = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => null,
  );
  useEffect(() => {
    hydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        state = e.newValue ? parseStored(e.newValue) : createSeed();
        lastPersisted = e.newValue;
        persistenceNotice = "";
        emit();
        if (state.revision === 0)
          window.dispatchEvent(new Event("ihealth-demo-reset"));
      } catch {
        persistenceNotice =
          "Another tab supplied invalid demo data. This tab has kept its current records.";
        if (state) state = { ...state };
        emit();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const dispatch = (actorId: string, command: Command) => {
    if (!state) throw new DemoError("Demo is still loading.");
    // Detect another tab's update before applying a stale command. No multi-user transaction claim.
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* Memory-only notice is surfaced by save. */
    }
    if (raw) {
      let persisted: AppState | null = null;
      try {
        persisted = parseStored(raw);
      } catch {
        /* Keep valid in-memory fixtures. */
      }
      if (persisted && raw !== lastPersisted) {
        state = persisted;
        lastPersisted = raw;
        emit();
        throw new DemoError(
          "Demo records changed in another tab. Review the updated referral and try again.",
        );
      }
    }
    save(execute(state, actorId, command));
  };
  return {
    state: current,
    dispatch,
    persistenceNotice,
    reset: () => {
      save(createSeed());
      window.dispatchEvent(new Event("ihealth-demo-reset"));
    },
  };
}
