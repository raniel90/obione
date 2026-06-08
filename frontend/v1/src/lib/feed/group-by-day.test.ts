import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { groupEventsByDay, dailyActivity } from "./group-by-day";
import type { FeedEvent } from "@/lib/api/types";

function ev(created_at: string, over: Partial<FeedEvent> = {}): FeedEvent {
  return {
    kind: "new_comment",
    project_id: "p1",
    project_name: "P",
    actor_id: "u1",
    target_id: `t-${created_at}`,
    created_at,
    summary: "s",
    ...over,
  };
}

describe("group-by-day", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("groups consecutive same-day events with human labels", () => {
    const groups = groupEventsByDay([
      ev("2026-06-04T10:00:00Z"),
      ev("2026-06-04T09:00:00Z"),
      ev("2026-06-03T18:00:00Z"),
      ev("2026-06-01T08:00:00Z"),
    ]);
    expect(groups.map((g) => g.label)).toEqual([
      "Hoje",
      "Ontem",
      "1 de junho de 2026",
    ]);
    expect(groups[0].events).toHaveLength(2);
    expect(groups[1].events).toHaveLength(1);
  });

  it("returns an empty grouping for no events", () => {
    expect(groupEventsByDay([])).toEqual([]);
  });

  it("dailyActivity counts per day with zero-gaps, oldest→newest", () => {
    const series = dailyActivity([
      ev("2026-06-04T10:00:00Z"),
      ev("2026-06-04T09:00:00Z"),
      ev("2026-06-02T08:00:00Z"),
    ]);
    // 02 (2) ... wait: 04 has 2, 03 has 0, 02 has 1 → oldest→newest = [02, 03, 04]
    expect(series).toEqual([1, 0, 2]);
  });

  it("dailyActivity is empty when there are no events", () => {
    expect(dailyActivity([])).toEqual([]);
  });
});
