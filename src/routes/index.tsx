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
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app-shell";
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
  const freePct = 100 - usedPct;
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

      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl font-display">Good afternoon</h1>
          <p className="text-sm text-muted-foreground">
            {formatBytes(USED_STORAGE)} used · {formatBytes(RECLAIMABLE)} reclaimable
          </p>
        </div>
        <div className="rounded-xl border border-border bg-secondary px-3 py-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground">Premium Active</span>
        </div>
      </header>

      {/* Storage bar card */}
      <Card className="relative overflow-hidden border-border bg-secondary/40">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <CardContent className="relative space-y-6 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Storage used
              </div>
              <div className="mt-1 text-3xl font-bold md:text-4xl font-display">
                <CountUpBytes value={USED_STORAGE} />{" "}
                <span className="text-base font-medium text-muted-foreground">
                  / {formatBytes(TOTAL_STORAGE)}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-primary/10 px-3 py-2 text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary">Reclaimable</div>
              <div className="text-lg font-bold text-primary">
                <CountUpBytes value={RECLAIMABLE} />
              </div>
            </div>
          </div>

          <div className="relative h-4 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
              style={{ width: `${usedPct}%` }}
            />
            <div
              className="absolute top-0 h-full bg-ocean-500 transition-all duration-500"
              style={{ left: `${usedPct - reclaimPct}%`, width: `${reclaimPct}%` }}
            />
            <div
              className="absolute top-0 h-full bg-muted-foreground/30 transition-all duration-500"
              style={{ left: `${usedPct}%`, width: `${freePct}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <LegendDot color="bg-primary" label={`Used ${formatBytes(USED_STORAGE)}`} />
            <LegendDot color="bg-ocean-500" label={`Reclaimable ${formatBytes(RECLAIMABLE)}`} />
            <LegendDot color="bg-muted-foreground/40" label={`Free ${formatBytes(TOTAL_STORAGE - USED_STORAGE)}`} />
          </div>
        </CardContent>
      </Card>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
        {/* Quick Scan — large, accent */}
        <button
          type="button"
          onClick={() => {
            if (scanUndoStatus === "error" || scanUndoStatus === "retry-error") {
              undoScanAction(true);
            } else if (scanning) {
              if (confirm("Cancel the scan?")) cancelScan();
            } else {
              startScan();
            }
          }}
          disabled={scanStatus === "cancelling" || scanUndoStatus === "undoing" || scanUndoStatus === "retrying"}
          className={`group relative col-span-1 row-span-2 overflow-hidden rounded-3xl bg-primary p-6 text-left text-primary-foreground transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-80 md:col-span-1 md:row-span-2 ${
            scanning ? "animate-pulse" : ""
          }`}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10">
              {scanUndoStatus === "retrying" || scanUndoStatus === "undoing" ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : scanUndoStatus === "success" ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : scanUndoStatus === "retry-error" || scanUndoStatus === "error" ? (
                <XCircle className="h-7 w-7" />
              ) : scanStatus === "cancelling" ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : scanStatus === "error" ? (
                <XCircle className="h-7 w-7" />
              ) : (
                <Search className="h-7 w-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-display">Quick Scan</h2>
                {scanning && (
                  <Badge className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                    {scanProgress}%
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-primary-foreground/70">{scanCardDescription}</p>
            </div>
          </div>
        </button>

        {/* Smart Clean */}
        <Link to="/clean" className="group block">
          <Card className="h-full border-border bg-card transition hover:border-primary/40 hover:bg-secondary/40">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold font-display">Smart Clean</h3>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">5 categories</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Clear caches & stale files</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Duplicates */}
        <Link to="/duplicates" className="group block">
          <Card className="h-full border-border bg-card transition hover:border-primary/40 hover:bg-secondary/40">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <Copy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold font-display">Duplicates</h3>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{duplicateCount} files</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Review matching files</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* History */}
        <Link to="/history" className="group block md:col-span-2">
          <Card className="h-full border-border bg-card transition hover:border-primary/40 hover:bg-secondary/40">
            <CardContent className="flex h-full items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold font-display">History</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Past cleanups & undo</p>
                </div>
              </div>
              <div className="text-muted-foreground">
                <svg className="h-5 w-5 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Scan undo history */}
      {scanUndoStack.length > 0 && (
        <Card className="border-dashed border-border">
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
    </div>
  );
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: <Search className="h-12 w-12 text-primary" />,
      title: "Smart storage analysis",
      body: "Find duplicates, stale downloads, and cached junk with a focused, professional scan engine.",
    },
    {
      icon: <Lock className="h-12 w-12 text-primary" />,
      title: "Everything stays on-device",
      body: "In the native app, scanning happens locally through Android MediaStore. No uploads, no accounts, no ads.",
    },
    {
      icon: <ShieldCheck className="h-12 w-12 text-primary" />,
      title: "Permission-based cleanup",
      body: "We request media read access, then use the system delete-confirmation dialog before any file is removed.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="w-full max-w-xs">
        <div className="mb-8 flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary text-secondary-foreground">
            {steps[step].icon}
          </div>
        </div>
        <h2 className="text-2xl font-bold font-display">{steps[step].title}</h2>
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
