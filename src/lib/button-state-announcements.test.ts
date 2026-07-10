import { describe, it, expect } from "vitest";
import {
  getScanButtonDisabled,
  getRetryButtonDisabled,
  getButtonStateAnnouncement,
  type ScanUndoStatus,
  type ScanStatus,
} from "./scan-announcements";

// The second aria-live region on the home page renders
// `getButtonStateAnnouncement(scanDisabled, retryDisabled)` on every render.
// These tests pin the announcement order a screen-reader user hears as the
// scan/retry lifecycle progresses.

function announce(
  sequence: Array<{ scan?: ScanStatus; undo: ScanUndoStatus }>,
): string[] {
  return sequence.map(({ scan = "idle", undo }) =>
    getButtonStateAnnouncement(
      getScanButtonDisabled(scan, undo),
      getRetryButtonDisabled(undo),
    ),
  );
}

function changes(msgs: string[]): string[] {
  return msgs.filter((m, i) => i === 0 || m !== msgs[i - 1]);
}

describe("Button state aria-live announcements", () => {
  it("announces retry → success as: disabled → enabled", () => {
    const msgs = announce([
      { undo: "idle" },
      { undo: "retrying" },
      { undo: "success" },
      { undo: "idle" },
    ]);
    expect(msgs).toEqual([
      "Scan and Retry buttons enabled",
      "Scan and Retry buttons disabled",
      "Scan and Retry buttons enabled",
      "Scan and Retry buttons enabled",
    ]);
    expect(changes(msgs)).toEqual([
      "Scan and Retry buttons enabled",
      "Scan and Retry buttons disabled",
      "Scan and Retry buttons enabled",
    ]);
  });

  it("announces retry → failure as: disabled → enabled (buttons re-enable on error)", () => {
    const msgs = announce([
      { undo: "idle" },
      { undo: "retrying" },
      { undo: "retry-error" },
    ]);
    expect(msgs).toEqual([
      "Scan and Retry buttons enabled",
      "Scan and Retry buttons disabled",
      "Scan and Retry buttons enabled",
    ]);
  });

  it("announces the first undo failure followed by a retry cycle", () => {
    const msgs = announce([
      { undo: "undoing" },
      { undo: "error" },
      { undo: "retrying" },
      { undo: "success" },
    ]);
    expect(msgs).toEqual([
      "Scan and Retry buttons disabled",
      "Scan and Retry buttons enabled",
      "Scan and Retry buttons disabled",
      "Scan and Retry buttons enabled",
    ]);
    const disabledIdx = msgs.indexOf("Scan and Retry buttons disabled", 2);
    const enabledIdx = msgs.indexOf("Scan and Retry buttons enabled", 3);
    expect(disabledIdx).toBeLessThan(enabledIdx);
  });

  it("cancelling a scan only disables the Scan button", () => {
    expect(
      getButtonStateAnnouncement(
        getScanButtonDisabled("cancelling", "idle"),
        getRetryButtonDisabled("idle"),
      ),
    ).toBe("Scan button disabled");
  });

  it("only the Retry button is disabled while an undo is in flight from an idle scan", () => {
    // scanStatus === "idle" but undo in flight → scan disabled too because
    // getScanButtonDisabled locks it during undoing/retrying.
    expect(
      getButtonStateAnnouncement(
        getScanButtonDisabled("idle", "undoing"),
        getRetryButtonDisabled("undoing"),
      ),
    ).toBe("Scan and Retry buttons disabled");
  });

  it("enabled is the default announcement when nothing is in flight", () => {
    expect(
      getButtonStateAnnouncement(
        getScanButtonDisabled("idle", "idle"),
        getRetryButtonDisabled("idle"),
      ),
    ).toBe("Scan and Retry buttons enabled");
    expect(
      getButtonStateAnnouncement(
        getScanButtonDisabled("cancelled", "success"),
        getRetryButtonDisabled("success"),
      ),
    ).toBe("Scan and Retry buttons enabled");
  });
});
