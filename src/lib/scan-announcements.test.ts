import { describe, it, expect } from "vitest";
import {
  getScanCardDescription,
  type ScanUndoStatus,
  type ScanStatus,
} from "./scan-announcements";

// The Scan card's aria-live region announces `getScanCardDescription(...)`
// on every render. These tests verify that a keyboard/screen-reader user
// hears the retry lifecycle in the correct order.

function announce(
  sequence: Array<{ undo: ScanUndoStatus; scan?: ScanStatus; scanning?: boolean }>,
): string[] {
  return sequence.map(({ undo, scan = "idle", scanning = false }) =>
    getScanCardDescription(undo, scan, scanning),
  );
}

describe("Scan card aria-live announcements", () => {
  it("announces the retry → success flow in order", () => {
    const announcements = announce([
      { undo: "idle" },
      { undo: "retrying" },
      { undo: "success" },
      { undo: "idle" },
    ]);

    expect(announcements).toEqual([
      "Find duplicates and junk",
      "Retrying…",
      "Undo succeeded",
      "Find duplicates and junk",
    ]);

    // The subsequence a screen reader will actually announce as new values:
    const changes = announcements.filter(
      (msg, i) => i === 0 || msg !== announcements[i - 1],
    );
    expect(changes).toEqual([
      "Find duplicates and junk",
      "Retrying…",
      "Undo succeeded",
      "Find duplicates and junk",
    ]);
  });

  it("announces the retry → failure flow in order", () => {
    const announcements = announce([
      { undo: "idle" },
      { undo: "retrying" },
      { undo: "retry-error" },
    ]);

    expect(announcements).toEqual([
      "Find duplicates and junk",
      "Retrying…",
      "Undo failed — tap to retry again",
    ]);
  });

  it("announces the first undo failure before Retrying… on a subsequent retry", () => {
    const announcements = announce([
      { undo: "undoing" },
      { undo: "error" },
      { undo: "retrying" },
      { undo: "success" },
    ]);

    expect(announcements).toEqual([
      "Undoing…",
      "Undo failed — tap to retry",
      "Retrying…",
      "Undo succeeded",
    ]);

    const retryingIdx = announcements.indexOf("Retrying…");
    const successIdx = announcements.indexOf("Undo succeeded");
    const failedIdx = announcements.findIndex((m) => m.startsWith("Undo failed"));
    expect(failedIdx).toBeLessThan(retryingIdx);
    expect(retryingIdx).toBeLessThan(successIdx);
  });

  it("undo status takes precedence over scan status", () => {
    expect(getScanCardDescription("retrying", "cancelling", true)).toBe("Retrying…");
    expect(getScanCardDescription("success", "error", false)).toBe("Undo succeeded");
    expect(getScanCardDescription("retry-error", "idle", true)).toBe(
      "Undo failed — tap to retry again",
    );
  });
});
