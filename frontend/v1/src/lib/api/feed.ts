import { api } from "./client";
import type { FeedEvent, FeedResponse } from "./types";

export async function getFeed(): Promise<FeedEvent[]> {
  const res = await api<FeedResponse>("/feed");
  return res.events;
}
