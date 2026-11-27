export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistory<T>(initialPresent: T): HistoryState<T> {
  return {
    past: [],
    present: initialPresent,
    future: [],
  };
}

export function pushHistory<T>(
  history: HistoryState<T>,
  newPresent: T,
  limit = 30,
): HistoryState<T> {
  try {
    if (JSON.stringify(history.present) === JSON.stringify(newPresent)) {
      return history;
    }
  } catch {
    // Nếu không stringify được thì tiếp tục push
  }

  const newPast = [...history.past, history.present];
  if (newPast.length > limit) {
    newPast.shift();
  }
  return {
    past: newPast,
    present: newPresent,
    future: [],
  };
}

export function canUndo<T>(history: HistoryState<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: HistoryState<T>): boolean {
  return history.future.length > 0;
}

export function undo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);
  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  const newFuture = history.future.slice(1);
  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  };
}
