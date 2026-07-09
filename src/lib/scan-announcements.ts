// Pure helpers for computing the announcements read out by the Scan card's
// aria-live regions. Extracted so they can be unit-tested independently of
// TanStack Router / React rendering.

export type ScanUndoStatus =
  | "idle"
  | "undoing"
  | "retrying"
  | "error"
  | "retry-error"
  | "success";

export type ScanStatus =
  | "idle"
  | "scanning"
  | "cancelling"
  | "cancelled"
  | "error";

export function getScanCardDescription(
  scanUndoStatus: ScanUndoStatus,
  scanStatus: ScanStatus,
  scanning: boolean,
): string {
  if (scanUndoStatus === "retrying") return "Retrying…";
  if (scanUndoStatus === "undoing") return "Undoing…";
  if (scanUndoStatus === "success") return "Undo succeeded";
  if (scanUndoStatus === "retry-error") return "Undo failed — tap to retry again";
  if (scanUndoStatus === "error") return "Undo failed — tap to retry";
  if (scanStatus === "error") return "Cancel failed";
  if (scanStatus === "cancelling") return "Cancelling…";
  if (scanning) return "Tap to cancel scan";
  if (scanStatus === "cancelled") return "Cancelled";
  return "Find duplicates and junk";
}
