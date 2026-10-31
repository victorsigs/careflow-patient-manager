import { describe, expect, it } from "vitest";
import { daysAdmitted, dischargeState, nextStatus } from "./patients";

describe("patient rules", () => {
  it("counts admission day as day 1", () => {
    expect(daysAdmitted("2026-10-31", "2026-10-31")).toBe(1);
    expect(daysAdmitted("2026-10-28", "2026-10-31")).toBe(4);
  });
  it("flags discharge dates relative to today", () => {
    expect(dischargeState("2026-10-30", "2026-10-31")).toBe("overdue");
    expect(dischargeState("2026-10-31", "2026-10-31")).toBe("today");
    expect(dischargeState("2026-11-01", "2026-10-31")).toBe("tomorrow");
    expect(dischargeState(undefined, "2026-10-31")).toBe("none");
  });
  it("cycles task status pending -> scheduled -> done -> pending", () => {
    expect(nextStatus("pending")).toBe("scheduled");
    expect(nextStatus("scheduled")).toBe("done");
    expect(nextStatus("done")).toBe("pending");
  });
});
