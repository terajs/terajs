export interface DevtoolsEventLike {
  type: string;
  timestamp: number;
  payload?: any;
}

export interface TimelineEntry {
  index: number;
  type: string;
  timestamp: number;
  summary: string;
}

export interface PerformanceTypeMetric {
  type: string;
  count: number;
  avgDeltaMs: number;
  maxDeltaMs: number;
}

export interface PerformanceMetrics {
  totalEvents: number;
  updatesPerSecond: number;
  effectRuns: number;
  renderEvents: number;
  queueEnqueued: number;
  queueRetried: number;
  queueFailed: number;
  queueFlushed: number;
  queueDepthEstimate: number;
  hotTypes: string[];
  byType: PerformanceTypeMetric[];
}

function safeString(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

export function summarizeEvent(event: DevtoolsEventLike): string {
  const payload = event.payload;
  if (!payload || typeof payload !== "object") {
    return safeString(payload);
  }

  const key = (payload as any).key;
  const scope = (payload as any).scope;
  const name = (payload as any).name;
  const value = (payload as any).value;

  if (key !== undefined) {
    return `key=${safeString(key)} value=${safeString(value)}`;
  }
  if (name !== undefined) {
    return `name=${safeString(name)}`;
  }
  if (scope !== undefined) {
    return `scope=${safeString(scope)}`;
  }

  const entries = Object.entries(payload as Record<string, unknown>).slice(0, 2);
  if (entries.length === 0) return "{}";
  return entries.map(([k, v]) => `${k}=${safeString(v)}`).join(" ");
}

export function buildTimeline(events: DevtoolsEventLike[], limit = 250): TimelineEntry[] {
  const start = Math.max(0, events.length - limit);
  return events.slice(start).map((event, index) => ({
    index: start + index,
    type: event.type,
    timestamp: event.timestamp,
    summary: summarizeEvent(event),
  }));
}

export function replayEventsAtIndex<T>(events: T[], index: number): T[] {
  if (events.length === 0) return [];
  if (index < 0) return [];
  if (index >= events.length) return events.slice();
  return events.slice(0, index + 1);
}

export function computePerformanceMetrics(events: DevtoolsEventLike[], windowMs = 10000): PerformanceMetrics {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      updatesPerSecond: 0,
      effectRuns: 0,
      renderEvents: 0,
      queueEnqueued: 0,
      queueRetried: 0,
      queueFailed: 0,
      queueFlushed: 0,
      queueDepthEstimate: 0,
      hotTypes: [],
      byType: [],
    };
  }

  const latestTimestamp = events[events.length - 1].timestamp;
  const windowStart = latestTimestamp - windowMs;
  const windowed = events.filter((e) => e.timestamp >= windowStart);

  const map = new Map<string, { count: number; last: number | null; deltaTotal: number; deltaMax: number }>();
  let effectRuns = 0;
  let renderEvents = 0;
  let queueEnqueued = 0;
  let queueRetried = 0;
  let queueFailed = 0;
  let queueFlushed = 0;

  for (const event of windowed) {
    if (event.type === "effect:run") effectRuns++;
    if (event.type.startsWith("component:render:")) renderEvents++;
    if (event.type === "queue:enqueue") queueEnqueued++;
    if (event.type === "queue:retry") queueRetried++;
    if (event.type === "queue:fail") queueFailed++;
    if (event.type === "queue:drained") queueFlushed++;

    const found = map.get(event.type) ?? { count: 0, last: null, deltaTotal: 0, deltaMax: 0 };
    if (found.last !== null) {
      const delta = Math.max(0, event.timestamp - found.last);
      found.deltaTotal += delta;
      if (delta > found.deltaMax) found.deltaMax = delta;
    }
    found.count += 1;
    found.last = event.timestamp;
    map.set(event.type, found);
  }

  const byType: PerformanceTypeMetric[] = Array.from(map.entries())
    .map(([type, data]) => {
      const intervals = Math.max(1, data.count - 1);
      return {
        type,
        count: data.count,
        avgDeltaMs: Number((data.deltaTotal / intervals).toFixed(2)),
        maxDeltaMs: Number(data.deltaMax.toFixed(2)),
      };
    })
    .sort((a, b) => b.count - a.count);

  const updatesPerSecond = Number((windowed.length / (windowMs / 1000)).toFixed(2));
  const hotTypes = byType.filter((m) => m.count >= 5).map((m) => m.type);
  const queueDepthEstimate = Math.max(0, queueEnqueued - queueFlushed - queueFailed);

  return {
    totalEvents: windowed.length,
    updatesPerSecond,
    effectRuns,
    renderEvents,
    queueEnqueued,
    queueRetried,
    queueFailed,
    queueFlushed,
    queueDepthEstimate,
    hotTypes,
    byType,
  };
}