import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  duplicateGroups as seedGroups,
  similarGroups as seedSimilarGroups,
  initialHistory,
  formatBytes,
  type DuplicateGroup,
  type MockFile,
  type HistoryEntry,
  type FileType,
} from "@/lib/pickle-data";
import { useDebouncedEffect } from "@/lib/use-debounced-effect";

const STORAGE_KEY = "pickle-polish:state:v1";

export type PickleContextType = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  minDupSize: number;
  setMinDupSize: (v: number) => void;
  scanDepth: "quick" | "standard" | "deep";
  setScanDepth: (v: "quick" | "standard" | "deep") => void;
  enabledTypes: Record<FileType, boolean>;
  setEnabledTypes: React.Dispatch<React.SetStateAction<Record<FileType, boolean>>>;
  excluded: string[];
  setExcluded: React.Dispatch<React.SetStateAction<string[]>>;
  groups: DuplicateGroup[];
  setGroups: React.Dispatch<React.SetStateAction<DuplicateGroup[]>>;
  similarGroups: DuplicateGroup[];
  similarSelected: Set<string>;
  similarSelectedFiles: MockFile[];
  similarReclaimable: number;
  similarCount: number;
  toggleSimilarFile: (id: string) => void;
  selectAllSimilarExceptRecommended: () => void;
  clearSimilarSelection: () => void;
  confirmDeleteSimilar: () => void;
  largeFileThreshold: number;
  setLargeFileThreshold: (v: number) => void;
  history: HistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  scanning: boolean;
  scanProgress: number;
  scanStatus: "idle" | "cancelling" | "cancelled" | "error";
  scanUndoStatus: "idle" | "undoing" | "retrying" | "error" | "retry-error" | "success";

  startScan: () => void;
  cancelScan: () => void;
  scanUndoStack: ScanUndoEntry[];
  undoScanAction: (isRetry?: boolean) => void;
  clearScanUndoHistory: () => void;
  filteredGroups: DuplicateGroup[];
  selectedFiles: MockFile[];
  reclaimableSelected: number;
  duplicateCount: number;
  toggleFile: (id: string) => void;
  selectAllExceptRecommended: () => void;
  clearSelection: () => void;
  confirmDelete: () => void;
  hydrated: boolean;
};

export type ScanUndoEntry = {
  id: string;
  kind: "cancel" | "resume";
  at: number;
  // Snapshot of scan state BEFORE this action, so undo restores it.
  prev: { scanning: boolean; progress: number };
};

type PersistedState = {
  darkMode: boolean;
  minDupSize: number;
  scanDepth: "quick" | "standard" | "deep";
  enabledTypes: Record<FileType, boolean>;
  excluded: string[];
  groups: DuplicateGroup[];
  history: HistoryEntry[];
  largeFileThreshold: number;
};

const PickleContext = createContext<PickleContextType | null>(null);

export function PickleProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(true);
  const [minDupSize, setMinDupSize] = useState(1); // MB
  const [scanDepth, setScanDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [enabledTypes, setEnabledTypes] = useState<Record<FileType, boolean>>({
    image: true,
    video: true,
    audio: true,
    document: true,
    app: false,
  });
  const [excluded, setExcluded] = useState<string[]>(["/Android/data", "/WhatsApp/Backups"]);
  const [groups, setGroups] = useState<DuplicateGroup[]>(seedGroups);
  const [similarGroups, setSimilarGroups] = useState<DuplicateGroup[]>(seedSimilarGroups);
  const [similarSelected, setSimilarSelected] = useState<Set<string>>(new Set());
  const [largeFileThreshold, setLargeFileThreshold] = useState(500); // MB
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const scanProgressRef = useRef(scanProgress);
  const cancelAttemptsRef = useRef(0);
  const undoAttemptsRef = useRef(0);
  const lastDisplayedProgressRef = useRef(0);

  const [scanStatus, setScanStatus] = useState<"idle" | "cancelling" | "cancelled" | "error">(
    "idle",
  );
  const [scanUndoStack, setScanUndoStack] = useState<ScanUndoEntry[]>([]);
  const [scanUndoStatus, setScanUndoStatus] = useState<
    "idle" | "undoing" | "retrying" | "error" | "retry-error" | "success"
  >("idle");

  const [hydrated, setHydrated] = useState(false);
  const scanTimer = useRef<number | null>(null);
  const statusTimer = useRef<number | null>(null);
  const undoStatusTimer = useRef<number | null>(null);

  useEffect(() => {
    scanProgressRef.current = scanProgress;
  }, [scanProgress]);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<PersistedState>;
        if (typeof s.darkMode === "boolean") setDarkMode(s.darkMode);
        if (typeof s.minDupSize === "number") setMinDupSize(s.minDupSize);
        if (s.scanDepth) setScanDepth(s.scanDepth);
        if (s.enabledTypes) setEnabledTypes(s.enabledTypes);
        if (Array.isArray(s.excluded)) setExcluded(s.excluded);
        if (Array.isArray(s.groups)) setGroups(s.groups);
        if (Array.isArray(s.history)) setHistory(s.history);
        if (typeof s.largeFileThreshold === "number") setLargeFileThreshold(s.largeFileThreshold);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // FIX 1: Debounce localStorage writes to prevent excessive serialization (500ms)
  useDebouncedEffect(
    () => {
      if (!hydrated) return;
      try {
        const payload: PersistedState = {
          darkMode,
          minDupSize,
          scanDepth,
          enabledTypes,
          excluded,
          groups,
          history,
          largeFileThreshold,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore quota errors
      }
    },
    [
      hydrated,
      darkMode,
      minDupSize,
      scanDepth,
      enabledTypes,
      excluded,
      groups,
      history,
      largeFileThreshold,
    ],
    500,
  );

  // Dark mode toggling on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    return () => {
      if (scanTimer.current) window.clearInterval(scanTimer.current);
      if (statusTimer.current) window.clearTimeout(statusTimer.current);
      if (undoStatusTimer.current) window.clearTimeout(undoStatusTimer.current);
    };
  }, []);

  // FIX 2 & 3: Refined memoization - only rebuild when actual content changes
  const filteredGroups = useMemo(() => {
    const minBytes = minDupSize * 1024 * 1024;
    return groups
      .map((g) => ({
        ...g,
        files: g.files.filter((f) => enabledTypes[f.type] && f.size >= minBytes),
      }))
      .filter((g) => g.files.length >= 2);
  }, [groups, minDupSize, enabledTypes]);

  // Only rebuild when filtered groups content actually changes
  const selectableFiles = useMemo(() => {
    const map = new Map<string, MockFile>();
    filteredGroups.forEach((g) => g.files.forEach((f) => map.set(f.id, f)));
    return map;
  }, [filteredGroups]);

  // FIX 4: Improved selected files calculation
  const selectedFiles = useMemo(
    () => [...selected].map((id) => selectableFiles.get(id)).filter(Boolean) as MockFile[],
    [selected, selectableFiles],
  );
  const reclaimableSelected = selectedFiles.reduce((n, f) => n + f.size, 0);
  const duplicateCount = filteredGroups.reduce((n, g) => n + g.files.length - 1, 0);

  const toggleFile = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllExceptRecommended = () => {
    const next = new Set<string>();
    filteredGroups.forEach((g) =>
      g.files.forEach((f) => {
        if (!f.recommended) next.add(f.id);
      }),
    );
    setSelected(next);
  };

  const clearSelection = () => setSelected(new Set());

  /* ---------------- Similar photos (near-duplicates) ---------------- */

  const similarSelectableFiles = useMemo(() => {
    const map = new Map<string, MockFile>();
    similarGroups.forEach((g) => g.files.forEach((f) => map.set(f.id, f)));
    return map;
  }, [similarGroups]);

  const similarSelectedFiles = useMemo(
    () =>
      [...similarSelected]
        .map((id) => similarSelectableFiles.get(id))
        .filter(Boolean) as MockFile[],
    [similarSelected, similarSelectableFiles],
  );
  const similarReclaimable = similarSelectedFiles.reduce((n, f) => n + f.size, 0);
  const similarCount = similarGroups.reduce((n, g) => n + Math.max(0, g.files.length - 1), 0);

  const toggleSimilarFile = (id: string) => {
    setSimilarSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllSimilarExceptRecommended = () => {
    const next = new Set<string>();
    similarGroups.forEach((g) =>
      g.files.forEach((f) => {
        if (!f.recommended) next.add(f.id);
      }),
    );
    setSimilarSelected(next);
  };

  const clearSimilarSelection = () => setSimilarSelected(new Set());

  const confirmDeleteSimilar = () => {
    const removed = similarSelectedFiles;
    if (removed.length === 0) return;
    const removedBytes = similarReclaimable;
    const prevGroups = similarGroups;
    setSimilarGroups((prev) =>
      prev
        .map((g) => ({ ...g, files: g.files.filter((f) => !similarSelected.has(f.id)) }))
        .filter((g) => g.files.length > 0),
    );
    clearSimilarSelection();
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      when: new Date().toISOString(),
      action: `Removed ${removed.length} similar photo${removed.length === 1 ? "" : "s"}`,
      reclaimed: removedBytes,
      files: removed.length,
    };
    setHistory((h) => [entry, ...h]);
    toast.success(`Reclaimed ${formatBytes(removedBytes)}`, {
      description: `${removed.length} similar photo${removed.length === 1 ? "" : "s"} cleaned.`,
      action: {
        label: "Undo",
        onClick: () => {
          setSimilarGroups(prevGroups);
          setHistory((h) => h.filter((x) => x.id !== entry.id));
          toast("Restored", { description: "Similar photos back in place." });
        },
      },
      duration: 6000,
    });
  };

  const clearStatusTimer = () => {
    if (statusTimer.current) {
      window.clearTimeout(statusTimer.current);
      statusTimer.current = null;
    }
  };

  // Internal: run a scan without touching the undo stack.
  const runScan = (resumeFrom: number) => {
    clearStatusTimer();
    setScanStatus("idle");
    setScanning(true);
    setScanProgress(resumeFrom);
    lastDisplayedProgressRef.current = resumeFrom;
    if (scanTimer.current) window.clearInterval(scanTimer.current);
    
    // FIX 5: Throttle scan progress updates - only update on meaningful changes (10%)
    scanTimer.current = window.setInterval(() => {
      setScanProgress((p) => {
        const nextProgress = p + 4;
        if (nextProgress >= 100) {
          if (scanTimer.current) window.clearInterval(scanTimer.current);
          setScanning(false);
          toast.success("Scan complete", {
            description: `Found ${filteredGroups.length} duplicate groups.`,
          });
          lastDisplayedProgressRef.current = 100;
          return 100;
        }
        // Only update display if crossing a 10% boundary to reduce renders
        const lastBucket = Math.floor(lastDisplayedProgressRef.current / 10);
        const nextBucket = Math.floor(nextProgress / 10);
        if (nextBucket !== lastBucket) {
          lastDisplayedProgressRef.current = nextProgress;
          return nextProgress;
        }
        return p;
      });
    }, 90) as unknown as number;
  };

  // Internal: stop a scan without touching the undo stack.
  const stopScan = () => {
    if (scanTimer.current) window.clearInterval(scanTimer.current);
    scanTimer.current = null;
    setScanning(false);
    setScanProgress(0);
    clearStatusTimer();
    setScanStatus("cancelled");
    statusTimer.current = window.setTimeout(() => {
      setScanStatus("idle");
      statusTimer.current = null;
    }, 600) as unknown as number;
  };

  // FIX 8: Optimize undo stack push - only allocate when needed
  const pushUndo = (entry: ScanUndoEntry) => {
    setScanUndoStack((s) => {
      if (s.length >= 20) {
        return [...s.slice(1), entry];
      }
      return [...s, entry];
    });
  };

  const startScan = () => {
    // Snapshot BEFORE starting a fresh scan (idle state).
    pushUndo({
      id: `su${Date.now()}`,
      kind: "resume",
      at: Date.now(),
      prev: { scanning: false, progress: 0 },
    });
    runScan(0);
  };

  const cancelScan = () => {
    if (scanStatus === "cancelling") return;

    cancelAttemptsRef.current += 1;
    const willFail = cancelAttemptsRef.current % 2 === 1;
    const progressAtCancel = scanProgressRef.current;
    clearStatusTimer();
    setScanStatus("cancelling");
    statusTimer.current = window.setTimeout(() => {
      if (willFail) {
        setScanStatus("error");
        toast.error("Cancel failed", {
          description: "The scan is still running. Try again.",
        });
        statusTimer.current = window.setTimeout(() => {
          setScanStatus("idle");
          statusTimer.current = null;
        }, 3000) as unknown as number;
      } else {
        pushUndo({
          id: `su${Date.now()}`,
          kind: "cancel",
          at: Date.now(),
          prev: { scanning: true, progress: progressAtCancel },
        });
        stopScan();
        toast("Scan cancelled", {
          description: "No changes were made.",
          action: {
            label: "Undo",
            onClick: () => undoScanAction(),
          },
          duration: 6000,
        });
      }
    }, 800) as unknown as number;
  };

  const undoScanAction = (isRetry = false) => {
    const isFromError = scanUndoStatus === "error" || scanUndoStatus === "retry-error";
    const actuallyRetrying = isRetry || isFromError;

    if (scanUndoStatus === "undoing" || scanUndoStatus === "retrying") return;
    setScanUndoStatus(actuallyRetrying ? "retrying" : "undoing");
    if (undoStatusTimer.current) window.clearTimeout(undoStatusTimer.current);

    undoAttemptsRef.current += 1;
    const willFail = undoAttemptsRef.current % 2 === 1;

    undoStatusTimer.current = window.setTimeout(() => {
      if (willFail) {
        setScanUndoStatus(actuallyRetrying ? "retry-error" : "error");
        toast.error("Undo failed", {
          description: "Could not roll back the last scan action. Try again.",
        });
        return;
      }

      setScanUndoStack((stack) => {
        if (stack.length === 0) return stack;
        const next = stack.slice(0, -1);
        const last = stack[stack.length - 1];
        // Restore the snapshot captured before that action.
        if (last.prev.scanning) {
          runScan(last.prev.progress);
          toast("Resumed scan", {
            description: `Continuing from ${last.prev.progress}%.`,
          });
        } else {
          stopScan();
          toast("Reverted", { description: "Scan is idle again." });
        }
        return next;
      });

      setScanUndoStatus("success");
      if (actuallyRetrying) {
        toast.success("Retry succeeded", {
          description: "The last scan action was successfully undone.",
        });
      }
      // Briefly flash the success confirmation, then return to the real
      // scan card state so the Retry action is re-enabled and the card
      // reflects whatever the scan is actually doing now.
      undoStatusTimer.current = window.setTimeout(() => {
        setScanUndoStatus("idle");
        undoStatusTimer.current = null;
      }, 800) as unknown as number;
    }, 600) as unknown as number;
  };

  const clearScanUndoHistory = () => setScanUndoStack([]);

  const confirmDelete = () => {
    const removed = selectedFiles;
    const removedBytes = reclaimableSelected;
    const prevGroups = groups;
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, files: g.files.filter((f) => !selected.has(f.id)) }))
        .filter((g) => g.files.length > 0),
    );
    clearSelection();
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      when: new Date().toISOString(),
      action: `Removed ${removed.length} duplicate file${removed.length === 1 ? "" : "s"}`,
      reclaimed: removedBytes,
      files: removed.length,
    };
    setHistory((h) => [entry, ...h]);
    toast.success(`Reclaimed ${formatBytes(removedBytes)}`, {
      description: `${removed.length} file${removed.length === 1 ? "" : "s"} cleaned.`,
      action: {
        label: "Undo",
        onClick: () => {
          setGroups(prevGroups);
          setHistory((h) => h.filter((x) => x.id !== entry.id));
          toast("Restored", {
            description: `${removed.length} file${removed.length === 1 ? "" : "s"} back in place.`,
          });
        },
      },
      duration: 6000,
    });
  };

  const value: PickleContextType = {
    darkMode,
    setDarkMode,
    minDupSize,
    setMinDupSize,
    scanDepth,
    setScanDepth,
    enabledTypes,
    setEnabledTypes,
    excluded,
    setExcluded,
    groups,
    setGroups,
    similarGroups,
    similarSelected,
    similarSelectedFiles,
    similarReclaimable,
    similarCount,
    toggleSimilarFile,
    selectAllSimilarExceptRecommended,
    clearSimilarSelection,
    confirmDeleteSimilar,
    largeFileThreshold,
    setLargeFileThreshold,
    history,
    setHistory,
    selected,
    setSelected,
    scanning,
    scanProgress,
    scanStatus,
    scanUndoStatus,

    startScan,
    cancelScan,
    scanUndoStack,
    undoScanAction,
    clearScanUndoHistory,
    filteredGroups,
    selectedFiles,
    reclaimableSelected,
    duplicateCount,
    toggleFile,
    selectAllExceptRecommended,
    clearSelection,
    confirmDelete,
    hydrated,
  };

  return <PickleContext.Provider value={value}>{children}</PickleContext.Provider>;
}

export function usePickle() {
  const ctx = useContext(PickleContext);
  if (!ctx) throw new Error("usePickle must be used within PickleProvider");
  return ctx;
}
