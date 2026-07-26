import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Folder, Trash2, ShieldCheck, Star, Download, Sparkles } from "lucide-react";
import { formatBytes } from "@/lib/pickle-data";
import { usePickle } from "@/lib/pickle-context";
import { FileIcon } from "@/components/pickle/shared";
import { exportFilesCsv } from "@/lib/export-utils";

export function SimilarPhotos() {
  const {
    similarGroups,
    similarSelected,
    similarSelectedFiles,
    similarReclaimable,
    toggleSimilarFile,
    selectAllSimilarExceptRecommended,
    clearSimilarSelection,
    confirmDeleteSimilar,
  } = usePickle();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const totalBytes = similarGroups.reduce(
    (n, g) => n + g.files.filter((f) => !f.recommended).reduce((s, f) => s + f.size, 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl font-display">Similar Photos</h1>
          <p className="text-sm text-muted-foreground">
            Near-duplicates that aren&apos;t exact copies — bursts, re-compressed shares and edits.{" "}
            {similarGroups.length} groups · up to {formatBytes(totalBytes)} reclaimable.
          </p>
        </div>
        <Button onClick={selectAllSimilarExceptRecommended} variant="secondary">
          Select all except best shot
        </Button>
      </div>

      <div className="space-y-4">
        {similarGroups.map((g) => (
          <Card key={g.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-display">{g.label}</CardTitle>
                  <CardDescription>
                    {g.files.length} near-matches ·{" "}
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
                const isSelected = similarSelected.has(f.id);
                return (
                  <label
                    key={f.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : f.recommended
                          ? "border-primary/30 bg-primary/5"
                          : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSimilarFile(f.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{f.name}</span>
                        <Badge variant="secondary" className="gap-1">
                          {Math.round(f.confidence * 100)}% similar
                        </Badge>
                        {f.recommended && (
                          <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                            <Star className="h-3 w-3" /> Best shot
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Folder className="h-3 w-3" /> {f.location}
                        </span>
                        <span>Modified {new Date(f.modified).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold">{formatBytes(f.size)}</div>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        ))}
        {similarGroups.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No similar photos left. Your library is tidy.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="sticky bottom-20 z-30 md:bottom-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
          <div className="text-sm">
            <div className="font-semibold">
              {similarSelected.size} selected · {formatBytes(similarReclaimable)}
            </div>
            <div className="text-xs text-muted-foreground">Best shots stay untouched.</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={clearSimilarSelection}
              disabled={similarSelected.size === 0}
            >
              Clear
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={similarSelected.size === 0}
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
            <DialogTitle className="flex items-center gap-2 font-display">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Review before deleting
            </DialogTitle>
            <DialogDescription>
              These are near-matches, not exact copies. Review them before cleaning.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/40 p-3">
            {similarSelectedFiles.map((f) => (
              <div key={f.id} className="flex items-center gap-3 text-sm">
                <FileIcon type={f.type} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{f.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{f.location}</div>
                </div>
                <div className="text-xs font-medium">{formatBytes(f.size)}</div>
              </div>
            ))}
            {similarSelectedFiles.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nothing selected.
              </div>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-accent/60 px-4 py-3 text-sm">
            <span className="text-accent-foreground">
              {similarSelectedFiles.length} file{similarSelectedFiles.length === 1 ? "" : "s"} ·
              reclaim
            </span>
            <span className="font-semibold text-primary">{formatBytes(similarReclaimable)}</span>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="gap-2 sm:mr-auto"
              disabled={similarSelectedFiles.length === 0}
              onClick={() => exportFilesCsv(similarSelectedFiles, "pickle-polish-similar-photos")}
            >
              <Download className="h-4 w-4" /> Export list (CSV)
            </Button>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                confirmDeleteSimilar();
                setConfirmOpen(false);
              }}
              disabled={similarSelectedFiles.length === 0}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Clean {similarSelectedFiles.length} file
              {similarSelectedFiles.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
