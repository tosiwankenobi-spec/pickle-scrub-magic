import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind as BroomIcon, Download } from "lucide-react";
import { formatBytes, type HistoryEntry } from "@/lib/pickle-data";
import { exportHistoryCsv, exportHistoryJson } from "@/lib/export-utils";

export function HistoryView({ entries }: { entries: HistoryEntry[] }) {
  // Memoize total reclaimed calculation
  const totalReclaimed = useMemo(() => entries.reduce((n, e) => n + e.reclaimed, 0), [entries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl font-display">Cleanup history</h1>
          <p className="text-sm text-muted-foreground">
            Logged locally. Total reclaimed: {formatBytes(totalReclaimed)}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={entries.length === 0}
            onClick={() => exportHistoryCsv(entries)}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={entries.length === 0}
            onClick={() => exportHistoryJson(entries)}
          >
            <Download className="h-4 w-4" /> Export JSON
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {entries.length > 0 ? (
            entries.map((e) => (
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
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No cleanups yet. Start cleaning to see your history.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
