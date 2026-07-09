import { Card, CardContent } from "@/components/ui/card";
import { Wind as BroomIcon } from "lucide-react";
import { formatBytes, type HistoryEntry } from "@/lib/pickle-data";

export function HistoryView({ entries }: { entries: HistoryEntry[] }) {
  const totalReclaimed = entries.reduce((n, e) => n + e.reclaimed, 0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl font-display">Cleanup history</h1>
        <p className="text-sm text-muted-foreground">
          Logged locally. Total reclaimed: {formatBytes(totalReclaimed)}.
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
