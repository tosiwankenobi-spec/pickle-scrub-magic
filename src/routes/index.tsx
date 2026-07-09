import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Trash2,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Download,
  Package,
  Database,
  ShieldCheck,
  Wind as BroomIcon,
  Home,
  Copy,
  Wand2,
  History,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Check,
  ChevronRight,
  Folder,
  Loader2,
  RotateCcw,
  Smartphone,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  duplicateGroups as seedGroups,
  cleanupCategories,
  initialHistory,
  formatBytes,
  TOTAL_STORAGE,
  USED_STORAGE,
  RECLAIMABLE,
  type DuplicateGroup,
  type MockFile,
  type HistoryEntry,
  type FileType,
} from "@/lib/pickle-data";
import logoAsset from "@/assets/pickle-polish-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: PickleApp,
});

// (Broom icon lives at top of imports as BroomIcon alias.)

type ViewId =
  | "onboarding"
  | "dashboard"
  | "duplicates"
  | "cleanup"
  | "history"
  | "settings"
  | "roadmap";

const NAV: { id: ViewId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
  { id: "duplicates", label: "Duplicates", icon: <Copy className="h-5 w-5" /> },
  { id: "cleanup", label: "Cleanup", icon: <Wand2 className="h-5 w-5" /> },
  { id: "history", label: "History", icon: <History className="h-5 w-5" /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon className="h-5 w-5" /> },
  { id: "roadmap", label: "Roadmap", icon: <Smartphone className="h-5 w-5" /> },
];

const STORAGE_KEY = "pickle-polish:state:v1";

type PersistedState = {
  darkMode: boolean;
  minDupSize: number;
  scanDepth: "quick" | "standard" | "deep";
  enabledTypes: Record<FileType, boolean>;
  excluded: string[];
  groups: DuplicateGroup[];
  history: HistoryEntry[];
};

function PickleApp() {
  const [view, setView] = useState<ViewId>("onboarding");
  const [darkMode, setDarkMode] = useState(false);
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
  const [newExcluded, setNewExcluded] = useState("");

  const [groups, setGroups] = useState<DuplicateGroup[]>(seedGroups);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const scanTimer = useRef<number | null>(null);

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
      }
      const onboarded = localStorage.getItem("pickle-polish:onboarded");
      if (onboarded === "1") setView("dashboard");
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
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
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
  }, [hydrated, darkMode, minDupSize, scanDepth, enabledTypes, excluded, groups, history]);

  // Dark mode toggling on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    return () => {
      if (scanTimer.current) window.clearInterval(scanTimer.current);
    };
  }, []);

  const filteredGroups = useMemo(() => {
    const minBytes = minDupSize * 1024 * 1024;
    return groups
      .map((g) => ({
        ...g,
        files: g.files.filter((f) => enabledTypes[f.type] && f.size >= minBytes),
      }))
      .filter((g) => g.files.length >= 2);
  }, [groups, minDupSize, enabledTypes]);

  const selectableFiles = useMemo(() => {
    const map = new Map<string, MockFile>();
    filteredGroups.forEach((g) => g.files.forEach((f) => map.set(f.id, f)));
    return map;
  }, [filteredGroups]);

  const selectedFiles = useMemo(
    () => [...selected].map((id) => selectableFiles.get(id)).filter(Boolean) as MockFile[],
    [selected, selectableFiles],
  );
  const reclaimableSelected = selectedFiles.reduce((n, f) => n + f.size, 0);

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

  const startScan = () => {
    setScanning(true);
    setScanProgress(0);
    if (scanTimer.current) window.clearInterval(scanTimer.current);
    scanTimer.current = window.setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          if (scanTimer.current) window.clearInterval(scanTimer.current);
          setScanning(false);
          toast.success("Scan complete", {
            description: `Found ${filteredGroups.length} duplicate groups.`,
          });
          return 100;
        }
        return p + 4;
      });
    }, 90) as unknown as number;
  };

  const confirmDelete = () => {
    const removed = selectedFiles;
    const removedBytes = reclaimableSelected;
    const prevGroups = groups; // snapshot for true undo
    // Remove from groups
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, files: g.files.filter((f) => !selected.has(f.id)) }))
        .filter((g) => g.files.length > 0),
    );
    setConfirmOpen(false);
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
      description: `${removed.length} file${removed.length === 1 ? "" : "s"} scrubbed clean.`,
      action: {
        label: "Undo",
        onClick: () => {
          setGroups(prevGroups); // restore exactly what was removed
          setHistory((h) => h.filter((x) => x.id !== entry.id));
          toast("Restored", {
            description: `${removed.length} file${removed.length === 1 ? "" : "s"} back in place.`,
          });
        },
      },
      duration: 6000,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {view === "onboarding" ? (
        <Onboarding
          onDone={() => {
            try {
              localStorage.setItem("pickle-polish:onboarded", "1");
            } catch {
              // ignore
            }
            setView("dashboard");
          }}
        />
      ) : (
        <div className="mx-auto flex min-h-screen max-w-7xl">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar p-4 md:flex md:flex-col">
            <BrandMark />
            <nav className="mt-6 flex flex-col gap-1">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    view === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto rounded-2xl bg-accent/60 p-4 text-xs text-accent-foreground">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4" /> Prototype
              </div>
              <p className="mt-1 text-muted-foreground">
                Web demo of Pickle Polish. Native cleanup needs Android APIs — see Roadmap.
              </p>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
            {/* Mobile header */}
            <header className="flex items-center justify-between border-b border-border bg-background/70 p-4 backdrop-blur md:hidden">
              <BrandMark compact />
              <Button size="icon" variant="ghost" onClick={() => setDarkMode((v) => !v)}>
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </header>

            <div className="flex-1 p-4 md:p-8">
              {view === "dashboard" && (
                <Dashboard
                  onScan={startScan}
                  scanning={scanning}
                  scanProgress={scanProgress}
                  goDuplicates={() => setView("duplicates")}
                  goCleanup={() => setView("cleanup")}
                  duplicateCount={filteredGroups.reduce((n, g) => n + g.files.length - 1, 0)}
                />
              )}
              {view === "duplicates" && (
                <Duplicates
                  groups={filteredGroups}
                  selected={selected}
                  toggleFile={toggleFile}
                  selectAllExceptRecommended={selectAllExceptRecommended}
                  clearSelection={clearSelection}
                  reclaimable={reclaimableSelected}
                  selectedCount={selected.size}
                  onDelete={() => setConfirmOpen(true)}
                  onScan={startScan}
                  scanning={scanning}
                  scanProgress={scanProgress}
                />
              )}
              {view === "cleanup" && <SmartCleanup />}
              {view === "history" && <HistoryView entries={history} />}
              {view === "settings" && (
                <SettingsView
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  minDupSize={minDupSize}
                  setMinDupSize={setMinDupSize}
                  enabledTypes={enabledTypes}
                  setEnabledTypes={setEnabledTypes}
                  excluded={excluded}
                  setExcluded={setExcluded}
                  newExcluded={newExcluded}
                  setNewExcluded={setNewExcluded}
                  scanDepth={scanDepth}
                  setScanDepth={setScanDepth}
                />
              )}
              {view === "roadmap" && <Roadmap />}
            </div>
          </main>

          {/* Mobile bottom nav */}
          <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/95 p-2 backdrop-blur md:hidden">
            {NAV.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                  view === item.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Review before deleting
            </DialogTitle>
            <DialogDescription>
              Pickle Polish will move these files to a recoverable bin. You can undo right
              after.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/40 p-3">
            {selectedFiles.map((f) => (
              <div key={f.id} className="flex items-center gap-3 text-sm">
                <FileIcon type={f.type} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{f.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{f.location}</div>
                </div>
                <div className="text-xs font-medium">{formatBytes(f.size)}</div>
              </div>
            ))}
            {selectedFiles.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nothing selected.
              </div>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-accent/60 px-4 py-3 text-sm">
            <span className="text-accent-foreground">
              {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} · reclaim
            </span>
            <span className="font-semibold text-primary">
              {formatBytes(reclaimableSelected)}
            </span>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={selectedFiles.length === 0}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Scrub {selectedFiles.length} file
              {selectedFiles.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Brand ---------- */

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoAsset.url}
        alt="Pickle Polish logo"
        className="h-11 w-11 rounded-2xl object-cover shadow-md shadow-primary/20 ring-1 ring-border"
      />
      {!compact ? (
        <div>
          <div className="text-base font-bold leading-tight tracking-tight">Pickle Polish</div>
          <div className="text-[11px] text-muted-foreground">
            Pickle-clean your phone storage
          </div>
        </div>
      ) : (
        <div className="text-base font-bold tracking-tight">Pickle Polish</div>
      )}
    </div>
  );
}

/* ---------- Onboarding ---------- */

function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: <span className="text-5xl">🥒</span>,
      title: "Meet Pickle Polish",
      body: "A tiny green scrubber for your phone storage. We find duplicates, junk, and stale files, and let you clean with confidence.",
    },
    {
      icon: <Lock className="h-12 w-12 text-primary" />,
      title: "Everything stays on-device",
      body: "In the native app, scanning happens locally through Android MediaStore. Nothing is uploaded — no accounts, no cloud, no ads.",
    },
    {
      icon: <ShieldCheck className="h-12 w-12 text-primary" />,
      title: "We'll ask for these permissions",
      body: "READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO on Android 13+, plus the system delete-confirmation dialog before any file is removed.",
    },
  ];
  const current = steps[step];
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-6 text-center">
      <BrandMark />
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-accent">
        {current.icon}
      </div>
      <div>
        <h1 className="text-2xl font-bold">{current.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{current.body}</p>
      </div>
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-8 bg-primary" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex w-full gap-2">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        <Button
          className="flex-1 gap-2"
          onClick={() => (step === steps.length - 1 ? onDone() : setStep((s) => s + 1))}
        >
          {step === steps.length - 1 ? "Allow & continue" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <button onClick={onDone} className="text-xs text-muted-foreground underline">
        Skip for now
      </button>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onScan,
  scanning,
  scanProgress,
  goDuplicates,
  goCleanup,
  goHistory,
  duplicateCount,
}: {
  onScan: () => void;
  scanning: boolean;
  scanProgress: number;
  goDuplicates: () => void;
  goCleanup: () => void;
  goHistory: () => void;
  duplicateCount: number;
}) {
  const usedPct = (USED_STORAGE / TOTAL_STORAGE) * 100;
  const reclaimPct = (RECLAIMABLE / TOTAL_STORAGE) * 100;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Good afternoon 🥒</h1>
          <p className="text-sm text-muted-foreground">
            {formatBytes(USED_STORAGE)} used · {formatBytes(RECLAIMABLE)} reclaimable
          </p>
        </div>
      </div>

      {scanning && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Scanning storage… {scanProgress}%
            </div>
            <Progress value={scanProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Grouping by size, sampling partial hash, verifying with SHA-256.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ActionTile
          title="Scan"
          description="Find duplicates and junk"
          icon={<BroomIcon className="h-7 w-7" />}
          onClick={onScan}
          scanning={scanning}
          accent
        />
        <ActionTile
          title="Clean"
          description="Clear caches & stale files"
          icon={<Sparkles className="h-7 w-7" />}
          onClick={goCleanup}
          badge="5 categories"
        />
        <ActionTile
          title="Duplicates"
          description="Review matching files"
          icon={<Copy className="h-7 w-7" />}
          onClick={goDuplicates}
          badge={`${duplicateCount} files`}
        />
        <ActionTile
          title="History"
          description="Past cleanups & undo"
          icon={<History className="h-7 w-7" />}
          onClick={goHistory}
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="relative pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Storage used
              </div>
              <div className="mt-1 text-3xl font-bold">
                <CountUpBytes value={USED_STORAGE} />{" "}
                <span className="text-base font-medium text-muted-foreground">
                  / {formatBytes(TOTAL_STORAGE)}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-primary/10 px-3 py-2 text-right">
              <div className="text-[11px] font-medium uppercase tracking-wide text-primary">
                Reclaimable
              </div>
              <div className="text-lg font-bold text-primary">
                <CountUpBytes value={RECLAIMABLE} />
              </div>
            </div>
          </div>
          <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-primary"
              style={{ width: `${usedPct}%` }}
            />
            <div
              className="absolute top-0 h-full bg-yellow-400/70"
              style={{ left: `${usedPct - reclaimPct}%`, width: `${reclaimPct}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <LegendDot color="bg-primary" label={`Used ${formatBytes(USED_STORAGE)}`} />
            <LegendDot
              color="bg-yellow-400"
              label={`Reclaimable ${formatBytes(RECLAIMABLE)}`}
            />
            <LegendDot
              color="bg-muted-foreground/40"
              label={`Free ${formatBytes(TOTAL_STORAGE - USED_STORAGE)}`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionTile({
  title,
  description,
  icon,
  onClick,
  badge,
  scanning,
  accent,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string;
  scanning?: boolean;
  accent?: boolean;
}) {
  return (
    <Card
      className={`group cursor-pointer transition active:scale-[0.98] ${
        accent
          ? "border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/10"
          : "hover:border-primary/40 hover:bg-accent/30"
      }`}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-start gap-3 p-4 pt-5 md:p-5 md:pt-6">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
            accent
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "bg-accent text-accent-foreground"
          }`}
        >
          {scanning ? <Loader2 className="h-7 w-7 animate-spin" /> : icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {badge}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="pt-6">
        <div
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
            accent ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  icon,
  cta,
  onClick,
  badge,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  cta: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <Card className="group cursor-pointer transition hover:border-primary/40 hover:shadow-md" onClick={onClick}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {badge && <Badge variant="secondary">{badge}</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </CardContent>
    </Card>
  );
}

/* ---------- Duplicates ---------- */

function Duplicates({
  groups,
  selected,
  toggleFile,
  selectAllExceptRecommended,
  clearSelection,
  reclaimable,
  selectedCount,
  onDelete,
  onScan,
  scanning,
  scanProgress,
}: {
  groups: DuplicateGroup[];
  selected: Set<string>;
  toggleFile: (id: string) => void;
  selectAllExceptRecommended: () => void;
  clearSelection: () => void;
  reclaimable: number;
  selectedCount: number;
  onDelete: () => void;
  onScan: () => void;
  scanning: boolean;
  scanProgress: number;
}) {
  const totalDupBytes = groups.reduce(
    (n, g) => n + g.files.filter((f) => !f.recommended).reduce((s, f) => s + f.size, 0),
    0,
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Duplicate Finder</h1>
          <p className="text-sm text-muted-foreground">
            {groups.length} groups · potentially reclaim {formatBytes(totalDupBytes)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onScan} disabled={scanning} className="gap-2">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <BroomIcon className="h-4 w-4" />}
            {scanning ? "Scrubbing…" : "Rescan"}
          </Button>
          <Button onClick={selectAllExceptRecommended} variant="secondary">
            Select all except recommended
          </Button>
        </div>
      </div>

      {scanning && <Progress value={scanProgress} className="h-2" />}

      <div className="space-y-4">
        {groups.map((g) => (
          <Card key={g.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <FileIcon type={g.type} />
                </div>
                <div>
                  <CardTitle className="text-base">{g.label}</CardTitle>
                  <CardDescription>
                    {g.files.length} copies ·{" "}
                    {formatBytes(
                      g.files.filter((f) => !f.recommended).reduce((s, f) => s + f.size, 0),
                    )}{" "}
                    reclaimable
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {g.files.map((f) => {
                const isSelected = selected.has(f.id);
                return (
                  <label
                    key={f.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : f.recommended
                          ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20"
                          : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleFile(f.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{f.name}</span>
                        {f.recommended && (
                          <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                            <Check className="h-3 w-3" /> Recommended keep
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          {Math.round(f.confidence * 100)}% match
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Folder className="h-3 w-3" /> {f.location}
                        </span>
                        <span>Modified {new Date(f.modified).toLocaleDateString()}</span>
                        <span className="uppercase">{f.type}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold">
                      {formatBytes(f.size)}
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        ))}
        {groups.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              🥒 All clean. Nothing duplicate found with current filters.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-20 z-30 md:bottom-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
          <div className="text-sm">
            <div className="font-semibold">
              {selectedCount} selected · {formatBytes(reclaimable)}
            </div>
            <div className="text-xs text-muted-foreground">
              Recommended keepers stay untouched.
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={clearSelection} disabled={selectedCount === 0}>
              Clear
            </Button>
            <Button
              onClick={onDelete}
              disabled={selectedCount === 0}
              className="gap-2"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Smart Cleanup ---------- */

function SmartCleanup() {
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(["junk", "screenshots"]));
  const toggle = (id: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const total = cleanupCategories
    .filter((c) => selectedCats.has(c.id))
    .reduce((n, c) => n + c.size, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Smart Cleanup</h1>
        <p className="text-sm text-muted-foreground">
          Pickle-picked categories, safe defaults.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {cleanupCategories.map((c) => {
          const active = selectedCats.has(c.id);
          return (
            <Card
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`cursor-pointer transition ${
                active ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"
              }`}
            >
              <CardContent className="flex items-start gap-4 pt-6">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${c.tint}`}>
                  <CategoryIcon icon={c.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{c.name}</h3>
                    <Checkbox checked={active} onCheckedChange={() => toggle(c.id)} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.count.toLocaleString()} items</span>
                    <span className="font-semibold text-primary">{formatBytes(c.size)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Selected categories
            </div>
            <div className="text-2xl font-bold text-primary">{formatBytes(total)}</div>
          </div>
          <Button
            className="gap-2"
            disabled={selectedCats.size === 0}
            onClick={() =>
              toast.success("Cleanup queued", {
                description: `Will reclaim ${formatBytes(total)} across ${selectedCats.size} categor${selectedCats.size === 1 ? "y" : "ies"}.`,
              })
            }
          >
            <BroomIcon className="h-4 w-4" />
            Scrub selected
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryIcon({ icon }: { icon: import("@/lib/pickle-data").CleanupCategory["icon"] }) {
  switch (icon) {
    case "trash":
      return <Trash2 className="h-5 w-5" />;
    case "image":
      return <ImageIcon className="h-5 w-5" />;
    case "video":
      return <Video className="h-5 w-5" />;
    case "download":
      return <Download className="h-5 w-5" />;
    case "app":
      return <Package className="h-5 w-5" />;
    case "cache":
    default:
      return <Database className="h-5 w-5" />;
  }
}

/* ---------- History ---------- */

function HistoryView({ entries }: { entries: HistoryEntry[] }) {
  const totalReclaimed = entries.reduce((n, e) => n + e.reclaimed, 0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Cleanup history</h1>
        <p className="text-sm text-muted-foreground">
          Every scrub, logged locally. Total reclaimed: {formatBytes(totalReclaimed)}.
        </p>
      </div>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BroomIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{e.action}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.when).toLocaleString()} · {e.files.toLocaleString()} files
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-primary">{formatBytes(e.reclaimed)}</div>
                <div className="text-xs text-muted-foreground">reclaimed</div>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No cleanups yet. Start scrubbing to see your history.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Settings ---------- */

function SettingsView({
  darkMode,
  setDarkMode,
  minDupSize,
  setMinDupSize,
  enabledTypes,
  setEnabledTypes,
  excluded,
  setExcluded,
  newExcluded,
  setNewExcluded,
  scanDepth,
  setScanDepth,
}: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  minDupSize: number;
  setMinDupSize: (v: number) => void;
  enabledTypes: Record<FileType, boolean>;
  setEnabledTypes: React.Dispatch<React.SetStateAction<Record<FileType, boolean>>>;
  excluded: string[];
  setExcluded: React.Dispatch<React.SetStateAction<string[]>>;
  newExcluded: string;
  setNewExcluded: (v: string) => void;
  scanDepth: "quick" | "standard" | "deep";
  setScanDepth: (v: "quick" | "standard" | "deep") => void;
}) {
  const types: { id: FileType; label: string; icon: React.ReactNode }[] = [
    { id: "image", label: "Images", icon: <ImageIcon className="h-4 w-4" /> },
    { id: "video", label: "Videos", icon: <Video className="h-4 w-4" /> },
    { id: "audio", label: "Audio", icon: <Music className="h-4 w-4" /> },
    { id: "document", label: "Documents", icon: <FileText className="h-4 w-4" /> },
    { id: "app", label: "App bundles", icon: <Package className="h-4 w-4" /> },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Tune Pickle Polish to your taste.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <div>
              <div className="font-medium">Dark mode</div>
              <div className="text-xs text-muted-foreground">
                Easier on the eyes during late-night scrubbing.
              </div>
            </div>
          </div>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Duplicate detection</CardTitle>
          <CardDescription>How aggressive should the scrubbing get?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <Label>Minimum duplicate size</Label>
              <span className="text-sm font-semibold">{minDupSize} MB</span>
            </div>
            <Slider
              className="mt-2"
              min={0}
              max={100}
              step={1}
              value={[minDupSize]}
              onValueChange={(v) => setMinDupSize(v[0])}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Ignore duplicate files smaller than this.
            </p>
          </div>

          <div>
            <Label>Scan depth</Label>
            <Select value={scanDepth} onValueChange={(v) => setScanDepth(v as typeof scanDepth)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick — size + name (fastest)</SelectItem>
                <SelectItem value="standard">Standard — size + partial hash</SelectItem>
                <SelectItem value="deep">Deep — full SHA-256 verify</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>File types to scan</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {types.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {t.icon} {t.label}
                  </span>
                  <Switch
                    checked={enabledTypes[t.id]}
                    onCheckedChange={(v) =>
                      setEnabledTypes((prev) => ({ ...prev, [t.id]: v }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Excluded folders</CardTitle>
          <CardDescription>
            Folders Pickle Polish will never peek into.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {excluded.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1 py-1">
                {p}
                <button
                  onClick={() => setExcluded((prev) => prev.filter((x) => x !== p))}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
            {excluded.length === 0 && (
              <span className="text-xs text-muted-foreground">No exclusions yet.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="/Path/To/Folder"
              value={newExcluded}
              onChange={(e) => setNewExcluded(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => {
                if (!newExcluded.trim()) return;
                setExcluded((prev) => [...prev, newExcluded.trim()]);
                setNewExcluded("");
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Roadmap ---------- */

function Roadmap() {
  const items = [
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Kotlin + Jetpack Compose",
      body: "Native Android UI, edge-to-edge, Material 3 dynamic color and predictive back.",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: "Android 13+ READ_MEDIA permissions",
      body: "Granular READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO with per-item picker fallback.",
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: "MediaStore scanning",
      body: "Enumerate files via MediaStore.Files and Environment.getExternalStorageDirectory().",
    },
    {
      icon: <Copy className="h-5 w-5" />,
      title: "Duplicate detection pipeline",
      body: "Group by size → sample partial hash (first 64 KB) → verify with full SHA-256.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Safe deletion",
      body: "MediaStore.createDeleteRequest() so the Android system confirms every batch.",
    },
    {
      icon: <History className="h-5 w-5" />,
      title: "Local-only cleanup history",
      body: "Room database, on-device. No cloud sync, no accounts, no telemetry.",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Background scheduling",
      body: "WorkManager for weekly maintenance scrubs when the phone is idle & charging.",
    },
  ];
  return (
    <div className="space-y-6">
      <Card className="border-yellow-300/60 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="flex gap-3 pt-6 text-sm">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
          <div>
            <div className="font-semibold">This is a web prototype.</div>
            <p className="mt-1 text-muted-foreground">
              A real phone cleanup app needs native Android APIs for MediaStore scanning,
              storage/media permissions, duplicate hashing, and safe deletion. Everything below
              lives outside a browser.
            </p>
          </div>
        </CardContent>
      </Card>
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Native Android roadmap</h1>
        <p className="text-sm text-muted-foreground">
          What Pickle Polish becomes on-device.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((i) => (
          <Card key={i.title}>
            <CardContent className="flex items-start gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {i.icon}
              </div>
              <div>
                <div className="font-semibold">{i.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{i.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Shared: file icon ---------- */

function FileIcon({ type }: { type: FileType }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "image":
      return <ImageIcon className={cls} />;
    case "video":
      return <Video className={cls} />;
    case "audio":
      return <Music className={cls} />;
    case "document":
      return <FileText className={cls} />;
    case "app":
      return <Package className={cls} />;
  }
}

/* ---------- Count-up animation ---------- */

function CountUpBytes({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setN(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{formatBytes(n)}</>;
}
