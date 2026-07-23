"use client";

import { useEffect, useRef, useState } from "react";
import type { QueueItem } from "@/lib/types";
import type { QueueCardActions } from "./queue-card";

const keyOf = (it: QueueItem) => `${it.storeType}-${it.storeProductId}`;

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return (
    t.tagName === "INPUT" ||
    t.tagName === "SELECT" ||
    t.tagName === "TEXTAREA" ||
    t.isContentEditable
  );
}

/** One-keystroke queue flow: j/k or arrows move the card highlight, A approves
 *  the highlighted card's pre-selected candidates, I ignores, Esc deselects.
 *  Cards register their actions via registerFor(id) and their DOM node via
 *  setCardEl(id) so the selection can trigger them and scroll into view. */
export function useQueueKeyboard(items: QueueItem[]) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const selectedRef = useRef(selectedIdx);
  selectedRef.current = selectedIdx;
  const cardActions = useRef(new Map<string, QueueCardActions>());
  const registerCbs = useRef(
    new Map<string, (a: QueueCardActions | null) => void>(),
  );
  const elCbs = useRef(new Map<string, (el: HTMLDivElement | null) => void>());
  const cardEls = useRef(new Map<string, HTMLDivElement>());

  // Keep the selection valid as the list shrinks.
  useEffect(() => {
    setSelectedIdx((sel) =>
      sel === null || items.length === 0
        ? null
        : Math.min(sel, items.length - 1),
    );
  }, [items.length]);

  // Scroll the highlighted card into view.
  useEffect(() => {
    if (selectedIdx === null) return;
    const item = items[selectedIdx];
    if (!item) return;
    cardEls.current
      .get(keyOf(item))
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIdx, items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const count = itemsRef.current.length;
      const k = e.key.toLowerCase();
      if (k === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((s) =>
          count === 0 ? null : s === null ? 0 : Math.min(s + 1, count - 1),
        );
      } else if (k === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((s) =>
          count === 0 ? null : s === null ? count - 1 : Math.max(s - 1, 0),
        );
      } else if (e.key === "Escape") {
        setSelectedIdx(null);
      } else if (k === "a" || k === "i") {
        const sel = selectedRef.current;
        if (sel === null) return;
        const item = itemsRef.current[sel];
        if (!item) return;
        e.preventDefault();
        const actions = cardActions.current.get(keyOf(item));
        if (k === "a") actions?.approve();
        else actions?.ignore();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Stable per-id callback for QueueCard's registerActions prop. */
  const registerFor = (id: string) => {
    let cb = registerCbs.current.get(id);
    if (!cb) {
      cb = (a: QueueCardActions | null) => {
        if (a) cardActions.current.set(id, a);
        else cardActions.current.delete(id);
      };
      registerCbs.current.set(id, cb);
    }
    return cb;
  };

  /** Stable per-id DOM ref callback for the card wrapper. */
  const setCardEl = (id: string) => {
    let cb = elCbs.current.get(id);
    if (!cb) {
      cb = (el: HTMLDivElement | null) => {
        if (el) cardEls.current.set(id, el);
        else cardEls.current.delete(id);
      };
      elCbs.current.set(id, cb);
    }
    return cb;
  };

  return { selectedIdx, setSelectedIdx, registerFor, setCardEl };
}
