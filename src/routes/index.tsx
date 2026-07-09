import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Copy,
  History,
  Lock,
  ShieldCheck,
  Loader2,
  Undo2,
  XCircle,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app-shell";
import { AnimatedPickleIcon } from "@/components/animated-pickle-icon";
import { usePickle } from "@/lib/pickle-context";
import {
  TOTAL_STORAGE,
  USED_STORAGE,
  RECLAIMABLE,
  formatBytes,
} from "@/lib/pickle-data";
import { CountUpBytes, LegendDot } from "@/components/pickle/shared";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [onboarded, setOnboarded] = useState(false);
  const [checking, setChecking] = useState(true);
  const { hydrated } = usePickle();

  useEffect(() => {
    if (!hydrated) return;
    try {
      const raw = localStorage.getItem("pickle-polish:onboarded");
      if (raw === "1") setOnboarded(true);
    } catch {
      // ignore
    }
    setChecking(false);
  }, [hydrated]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!onboarded) {
    return (
      <Onboarding
        onDone={() => {
          try {
            localStorage.setItem("pickle-polish:onboarded", "1");
          } catch {
            // ignore
          }
          setOnboarded(true);
        }}
      />
    );
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const {
    startScan,
    cancelScan,
    scanning,
    scanProgress,
    scanStatus,
    scanUndoStatus,
    duplicateCount,
    scanUndoStack,
    undoScanAction,
    clearScanUndoHistory,
  } = usePickle();

  const usedPct = (USED_STORAGE / TOTAL_STORAGE) * 100;
  const reclaimPct = (RECLAIMABLE / TOTAL_STORAGE) * 100;
  const lastUndo = scanUndoStack[scanUndoStack.length - 1];
  const undoLabel = lastUndo
    ? lastUndo.kind === "cancel"
      ? `Resume from ${lastUndo.prev.progress}%`
      : "Stop scan"
    : "";

  const scanCardDescription =
    scanUndoStatus === "retrying"
      ? "Retrying…"
      : scanUndoStatus === "undoing"
        ? "Undoing…"
        : scanUndoStatus === "success"
          ? "Undo succeeded"
          : scanUndoStatus === "retry-error"
            ? "Undo failed — tap to retry again"
            : scanUndoStatus === "error"
              ? "Undo failed — tap to retry"
              : scanStatus === "error"
                ? "Cancel failed"
                : scanStatus === "cancelling"
                  ? "Cancelling…"
                  : scanning
                    ? "Tap to cancel scan"
                    : scanStatus === "cancelled"
                      ? "Cancelled"
                      : "Find duplicates and junk";

  return (
    <div className="space-y-6">
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {scanCardDescription}
      </span>
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
          description={scanCardDescription}
          icon={
            scanUndoStatus === "retrying" || scanUndoStatus === "undoing" ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : scanUndoStatus === "success" ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            ) : scanUndoStatus === "retry-error" || scanUndoStatus === "error" ? (
              <XCircle className="h-10 w-10 text-destructive" />
            ) : scanStatus === "cancelling" ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : scanStatus === "error" ? (
              <XCircle className="h-10 w-10 text-destructive" />
            ) : (
              <AnimatedPickleIcon size={44} scanning={scanning} />
            )
          }
          onClick={() => {
            if (scanUndoStatus === "error" || scanUndoStatus === "retry-error") {
              undoScanAction(true);
            } else if (scanning) {
              if (confirm("Cancel the scan?")) cancelScan();
            } else {
              startScan();
            }
          }}
          badge={scanning ? `${scanProgress}%` : undefined}
          accent
          disabled={scanStatus === "cancelling" || scanUndoStatus === "undoing" || scanUndoStatus === "retrying"}
        />


        <ActionTile
          title="Clean"
          description="Clear caches & stale files"
          icon={<Sparkles className="h-7 w-7" />}
          to="/clean"
          badge="5 categories"
        />
        <ActionTile
          title="Duplicates"
          description="Review matching files"
          icon={<Copy className="h-7 w-7" />}
          to="/duplicates"
          badge={`${duplicateCount} files`}
        />
        <ActionTile
          title="History"
          description="Past cleanups & undo"
          icon={<History className="h-7 w-7" />}
          to="/history"
        />
      </div>

      {scanUndoStack.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Undo2 className="h-3.5 w-3.5" />
              <span>
                Scan history · {scanUndoStack.length} step
                {scanUndoStack.length === 1 ? "" : "s"}
              </span>
              <div className="ml-1 hidden gap-1 sm:flex">
                {scanUndoStack.slice(-5).map((e) => (
                  <span
                    key={e.id}
                    className={`h-1.5 w-4 rounded-full ${
                      e.kind === "cancel" ? "bg-destructive/60" : "bg-primary/60"
                    }`}
                    title={
                      e.kind === "cancel"
                        ? `Cancelled at ${e.prev.progress}%`
                        : "Started scan"
                    }
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => undoScanAction()}

              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo · {undoLabel}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={clearScanUndoHistory}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



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

type ActionTileProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  accent?: boolean;
  disabled?: boolean;
} & (
  | { to: "/clean" | "/duplicates" | "/history" | "/settings" | "/roadmap"; onClick?: () => void }
  | { to?: undefined; onClick: () => void }
);

function ActionTile({
  title,
  description,
  icon,
  to,
  onClick,
  badge,
  accent,
  disabled,
}: ActionTileProps) {
  const card = (
    <Card
      className={`group transition ${
        disabled
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer active:scale-[0.98]"
      } ${
        accent
          ? disabled
            ? "border-primary/30 bg-primary/5"
            : "border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/10"
          : disabled
            ? "bg-accent/20"
            : "hover:border-primary/40 hover:bg-accent/30"
      }`}
    >
      <CardContent className="flex flex-col items-start gap-3 p-4 pt-5 md:p-5 md:pt-6">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
            accent
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "bg-accent text-accent-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {badge}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick}>
        {card}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-left"
    >
      {card}
    </button>
  );
}


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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="w-full max-w-xs">
        <div className="mb-8 flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            {steps[step].icon}
          </div>
        </div>
        <h2 className="text-2xl font-bold">{steps[step].title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{steps[step].body}</p>

        <div className="mt-8 flex justify-center gap-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition ${
                i === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button className="flex-1 gap-1" onClick={() => setStep((s) => s + 1)}>
              Next <span aria-hidden>›</span>
            </Button>
          ) : (
            <Button className="flex-1 gap-1" onClick={onDone}>
              Allow & continue <span aria-hidden>›</span>
            </Button>
          )}
        </div>

        <button
          onClick={onDone}
          className="mt-4 text-sm text-muted-foreground underline hover:text-foreground"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
