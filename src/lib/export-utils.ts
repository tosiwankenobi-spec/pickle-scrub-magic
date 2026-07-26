import { formatBytes, type HistoryEntry, type MockFile } from "@/lib/pickle-data";

function escapeCsv(value: string | number): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
}

export function downloadBlob(content: string, filename: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

export function exportHistoryCsv(entries: HistoryEntry[]) {
  const rows: (string | number)[][] = [["Action", "Date", "Files", "Bytes reclaimed", "Reclaimed"]];
  entries.forEach((e) => {
    rows.push([e.action, new Date(e.when).toISOString(), e.files, e.reclaimed, formatBytes(e.reclaimed)]);
  });
  const totalFiles = entries.reduce((n, e) => n + e.files, 0);
  const totalBytes = entries.reduce((n, e) => n + e.reclaimed, 0);
  rows.push(["TOTAL", "", totalFiles, totalBytes, formatBytes(totalBytes)]);
  downloadBlob(toCsv(rows), `pickle-polish-history-${stamp()}.csv`, "text/csv");
}

export function exportHistoryJson(entries: HistoryEntry[]) {
  const payload = {
    generatedAt: new Date().toISOString(),
    app: "Pickle Polish",
    entries: entries.map((e) => ({
      action: e.action,
      date: new Date(e.when).toISOString(),
      files: e.files,
      bytesReclaimed: e.reclaimed,
      reclaimed: formatBytes(e.reclaimed),
    })),
    total: {
      entries: entries.length,
      files: entries.reduce((n, e) => n + e.files, 0),
      bytesReclaimed: entries.reduce((n, e) => n + e.reclaimed, 0),
      reclaimed: formatBytes(entries.reduce((n, e) => n + e.reclaimed, 0)),
    },
  };
  downloadBlob(
    JSON.stringify(payload, null, 2),
    `pickle-polish-history-${stamp()}.json`,
    "application/json",
  );
}

export function exportFilesCsv(files: MockFile[], filenamePrefix = "pickle-polish-cleanup-list") {
  const rows: (string | number)[][] = [
    ["Name", "Type", "Location", "Modified", "Match confidence", "Bytes", "Size"],
  ];
  files.forEach((f) => {
    rows.push([
      f.name,
      f.type,
      f.location,
      new Date(f.modified).toISOString(),
      `${Math.round(f.confidence * 100)}%`,
      f.size,
      formatBytes(f.size),
    ]);
  });
  const totalBytes = files.reduce((n, f) => n + f.size, 0);
  rows.push(["TOTAL", "", "", "", "", totalBytes, formatBytes(totalBytes)]);
  downloadBlob(toCsv(rows), `${filenamePrefix}-${stamp()}.csv`, "text/csv");
}
