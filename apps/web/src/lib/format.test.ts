import { describe, expect, it } from "vitest";

import { formatSyncedAt } from "./format";

describe("formatSyncedAt", () => {
  it("shows UFOP's local time whatever the runtime's zone", () => {
    expect(formatSyncedAt("2026-11-15T17:30:00Z")).toBe("15/11 às 14:30");
    expect(formatSyncedAt("2027-02-13T02:05:00Z")).toBe("12/02 às 23:05");
  });
});
