import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Folder, Loader2, Trash2, ShieldCheck, Check, Wind as BroomIcon } from "lucide-react";
import { formatBytes } from "@/lib/pickle-data";
import { usePickle } from "@/lib/pickle-context";
import { FileIcon } from "@/components/pickle/shared";

export function Duplicates() {
  const {
    filteredGroups,
    selected,
    toggleFile,
    selectAllExceptRecommended,
    clearSelection,
    reclaimableSelected,
    selectedFiles,
    confirmDelete,
    startScan,
    scanning,
    scanProgress,
  } = usePickle();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const totalDupBytes = filteredGroups.reduce(
    (n, g) => n + g.files.filter((f) => !f.recommended).reduce((s, f) => s + f.size, 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Duplicate Finder</h1>
          <p className="text-sm text-muted-foreground">
            {filteredGroups.length} groups · potentially reclaim {formatBytes(totalDupBytes)}
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
        {filteredGroups.map((g) => (
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
        {filteredGroups.length === 0 && (
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
              {selected.size} selected · {formatBytes(reclaimableSelected)}
            </div>
            <div className="text-xs text-muted-foreground">
              Recommended keepers stay untouched.
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={clearSelection} disabled={selected.size === 0}>
              Clear
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={selected.size === 0}
              className="gap-2"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete selected
            </Button>
          </div>
        </div>
      </div>

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
              onClick={() => {
                confirmDelete();
                setConfirmOpen(false);
              }}
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
