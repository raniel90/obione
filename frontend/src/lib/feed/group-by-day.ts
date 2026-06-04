import {
  addDays,
  format,
  isToday,
  isYesterday,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FeedEvent } from "@/lib/api/types";

export interface DayGroup {
  key: string; // yyyy-MM-dd
  label: string;
  events: FeedEvent[];
}

function dayLabel(d: Date): string {
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Group feed events (already sorted newest-first) into consecutive day buckets
 * with a human label (Hoje / Ontem / "4 de junho de 2026"). Order is preserved.
 */
export function groupEventsByDay(events: FeedEvent[]): DayGroup[] {
  // Defensive: the API returns events newest-first, but grouping by consecutive
  // runs would split a day into two groups if the order ever changed. Sort to
  // make the grouping order-independent.
  const sorted = [...events].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const groups: DayGroup[] = [];
  let current: DayGroup | null = null;
  for (const event of sorted) {
    const d = parseISO(event.created_at);
    const key = format(d, "yyyy-MM-dd");
    if (!current || current.key !== key) {
      current = { key, label: dayLabel(d), events: [] };
      groups.push(current);
    }
    current.events.push(event);
  }
  return groups;
}

/**
 * Event counts per calendar day from the earliest event (capped at `maxDays`
 * ago) up to today, oldest→newest, including zero-days — a series for the
 * activity sparkline (the temporal trend).
 */
export function dailyActivity(events: FeedEvent[], maxDays = 14): number[] {
  if (events.length === 0) return [];
  const counts = new Map<string, number>();
  const today = startOfDay(new Date());
  let earliest = today;
  for (const event of events) {
    const d = startOfDay(parseISO(event.created_at));
    counts.set(format(d, "yyyy-MM-dd"), (counts.get(format(d, "yyyy-MM-dd")) ?? 0) + 1);
    if (d < earliest) earliest = d;
  }
  const minAllowed = subDays(today, maxDays - 1);
  const start = earliest < minAllowed ? minAllowed : earliest;
  const series: number[] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) {
    series.push(counts.get(format(d, "yyyy-MM-dd")) ?? 0);
  }
  return series;
}
