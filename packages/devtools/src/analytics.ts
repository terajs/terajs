export interface DevtoolsEventLike {
  type: string;
  timestamp: number;
  payload?: any;
  level?: "info" | "warn" | "error";
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
  hubConnections: number;
  hubDisconnections: number;
  hubErrors: number;
  hubPushReceived: number;
  queueEnqueued: number;
  queueConflicts: number;
  queueRetried: number;
  queueFailed: number;
  queueFlushed: number;
  queueDepthEstimate: number;
  hotTypes: string[];
  byType: PerformanceTypeMetric[];
}

export interface RouterRouteMetric {
  route: string;
  hits: number;
  blocked: number;
  redirects: number;
  errors: number;
  avgLoadMs: number;
  maxLoadMs: number;
}

export interface RouterMetrics {
  totalRouteEvents: number;
  navigationStarts: number;
  navigationEnds: number;
  routeChanges: number;
  redirects: number;
  blocked: number;
  warnings: number;
  errors: number;
  loadStarts: number;
  loadEnds: number;
  pendingNavigations: number;
  avgLoadMs: number;
  maxLoadMs: number;
  currentRoute: string | null;
  mostActiveRoute: string | null;
  byRoute: RouterRouteMetric[];
}

export interface IssueBucketMetric {
  index: number;
  label: string;
  count: number;
  errors: number;
  warns: number;
}

export interface IssueTypeMetric {
  type: string;
  count: number;
  errors: number;
  warns: number;
}

export interface IssueFingerprintMetric {
  fingerprint: string;
  type: string;
  message: string;
  count: number;
  severity: "error" | "warn";
  lastSeenAt: number;
}

export interface IssueMetrics {
  windowMs: number;
  totalIssues: number;
  errorCount: number;
  warnCount: number;
  uniqueIssueFingerprints: number;
  issueRatePerMinute: number;
  lastIssueAt: number | null;
  spikeDetected: boolean;
  byType: IssueTypeMetric[];
  byFingerprint: IssueFingerprintMetric[];
  buckets: IssueBucketMetric[];
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
      hubConnections: 0,
      hubDisconnections: 0,
      hubErrors: 0,
      hubPushReceived: 0,
      queueEnqueued: 0,
      queueConflicts: 0,
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
  const hasQueueFlushEvents = windowed.some((event) => event.type === "queue:flush");

  const map = new Map<string, { count: number; last: number | null; deltaTotal: number; deltaMax: number }>();
  let effectRuns = 0;
  let renderEvents = 0;
  let hubConnections = 0;
  let hubDisconnections = 0;
  let hubErrors = 0;
  let hubPushReceived = 0;
  let queueEnqueued = 0;
  let queueConflicts = 0;
  let queueRetried = 0;
  let queueFailed = 0;
  let queueFlushed = 0;

  for (const event of windowed) {
    const payload = event.payload && typeof event.payload === "object"
      ? event.payload as Record<string, unknown>
      : null;

    if (event.type === "effect:run") effectRuns++;
    if (event.type.startsWith("component:render:")) renderEvents++;
    if (event.type === "hub:connect") hubConnections++;
    if (event.type === "hub:disconnect") hubDisconnections++;
    if (event.type === "hub:error") hubErrors++;
    if (event.type === "hub:push:received") hubPushReceived++;
    if (event.type === "queue:enqueue") queueEnqueued++;
    if (event.type === "queue:conflict") queueConflicts++;
    if (event.type === "queue:retry") queueRetried++;
    if (event.type === "queue:fail") queueFailed++;
    if (event.type === "queue:flush") {
      const flushed = payload && typeof payload.flushed === "number" && Number.isFinite(payload.flushed)
        ? Math.max(0, payload.flushed)
        : 0;
      queueFlushed += flushed;
    }
    if (!hasQueueFlushEvents && event.type === "queue:drained") {
      const flushed = payload && typeof payload.flushed === "number" && Number.isFinite(payload.flushed)
        ? Math.max(0, payload.flushed)
        : 1;
      queueFlushed += flushed;
    }

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
    hubConnections,
    hubDisconnections,
    hubErrors,
    hubPushReceived,
    queueEnqueued,
    queueConflicts,
    queueRetried,
    queueFailed,
    queueFlushed,
    queueDepthEstimate,
    hotTypes,
    byType,
  };
}

export function computeRouterMetrics(events: DevtoolsEventLike[], windowMs = 30000): RouterMetrics {
  const latestTimestamp = events.length > 0 ? events[events.length - 1].timestamp : Date.now();
  const windowStart = latestTimestamp - windowMs;
  const windowed = events.filter((event) => {
    if (event.timestamp < windowStart) {
      return false;
    }

    return event.type.startsWith("route:") || event.type === "error:router";
  });

  if (windowed.length === 0) {
    return {
      totalRouteEvents: 0,
      navigationStarts: 0,
      navigationEnds: 0,
      routeChanges: 0,
      redirects: 0,
      blocked: 0,
      warnings: 0,
      errors: 0,
      loadStarts: 0,
      loadEnds: 0,
      pendingNavigations: 0,
      avgLoadMs: 0,
      maxLoadMs: 0,
      currentRoute: null,
      mostActiveRoute: null,
      byRoute: []
    };
  }

  let navigationStarts = 0;
  let navigationEnds = 0;
  let routeChanges = 0;
  let redirects = 0;
  let blocked = 0;
  let warnings = 0;
  let errors = 0;
  let loadStarts = 0;
  let loadEnds = 0;

  let currentRoute: string | null = null;
  const pendingTargets = new Set<string>();
  const loadStartByRoute = new Map<string, number>();
  const loadDurations: number[] = [];

  type RouteAccumulator = {
    route: string;
    hits: number;
    blocked: number;
    redirects: number;
    errors: number;
    loadDurations: number[];
  };

  const routeMap = new Map<string, RouteAccumulator>();

  const ensureRoute = (route: string): RouteAccumulator => {
    const existing = routeMap.get(route);
    if (existing) {
      return existing;
    }

    const created: RouteAccumulator = {
      route,
      hits: 0,
      blocked: 0,
      redirects: 0,
      errors: 0,
      loadDurations: []
    };

    routeMap.set(route, created);
    return created;
  };

  for (const event of windowed) {
    const payload = event.payload && typeof event.payload === "object"
      ? event.payload as Record<string, unknown>
      : {};

    const to = typeof payload.to === "string"
      ? payload.to
      : typeof payload.route === "string"
      ? payload.route
      : null;

    if (event.type === "route:navigate:start") {
      navigationStarts += 1;
      if (to) {
        pendingTargets.add(to);
      }
      continue;
    }

    if (event.type === "route:navigate:end") {
      navigationEnds += 1;
      if (to) {
        pendingTargets.delete(to);
      }
      continue;
    }

    if (event.type === "route:changed") {
      routeChanges += 1;
      if (to) {
        currentRoute = to;
        ensureRoute(to).hits += 1;
        pendingTargets.delete(to);
      }
      continue;
    }

    if (event.type === "route:redirect") {
      redirects += 1;
      if (to) {
        ensureRoute(to).redirects += 1;
        pendingTargets.delete(to);
      }
      continue;
    }

    if (event.type === "route:blocked") {
      blocked += 1;
      if (to) {
        ensureRoute(to).blocked += 1;
        pendingTargets.delete(to);
      }
      continue;
    }

    if (event.type === "route:warn") {
      warnings += 1;
      continue;
    }

    if (event.type === "route:load:start") {
      loadStarts += 1;
      if (to) {
        loadStartByRoute.set(to, event.timestamp);
      }
      continue;
    }

    if (event.type === "route:load:end") {
      loadEnds += 1;

      const explicitDuration = payload.durationMs;
      let durationMs: number | undefined;
      if (typeof explicitDuration === "number" && Number.isFinite(explicitDuration)) {
        durationMs = Math.max(0, explicitDuration);
      } else if (to && loadStartByRoute.has(to)) {
        durationMs = Math.max(0, event.timestamp - (loadStartByRoute.get(to) ?? event.timestamp));
      }

      if (typeof durationMs === "number") {
        loadDurations.push(durationMs);
        if (to) {
          ensureRoute(to).loadDurations.push(durationMs);
        }
      }

      if (to) {
        loadStartByRoute.delete(to);
      }
      continue;
    }

    if (event.type === "error:router") {
      errors += 1;
      if (to) {
        ensureRoute(to).errors += 1;
        pendingTargets.delete(to);
      }
    }
  }

  const averageLoadMs = loadDurations.length > 0
    ? Number((loadDurations.reduce((total, value) => total + value, 0) / loadDurations.length).toFixed(2))
    : 0;
  const maxLoadMs = loadDurations.length > 0
    ? Number(Math.max(...loadDurations).toFixed(2))
    : 0;

  const byRoute: RouterRouteMetric[] = Array.from(routeMap.values())
    .map((entry) => {
      const routeAverage = entry.loadDurations.length > 0
        ? Number((entry.loadDurations.reduce((total, value) => total + value, 0) / entry.loadDurations.length).toFixed(2))
        : 0;
      const routeMax = entry.loadDurations.length > 0
        ? Number(Math.max(...entry.loadDurations).toFixed(2))
        : 0;

      return {
        route: entry.route,
        hits: entry.hits,
        blocked: entry.blocked,
        redirects: entry.redirects,
        errors: entry.errors,
        avgLoadMs: routeAverage,
        maxLoadMs: routeMax
      };
    })
    .sort((left, right) => {
      const leftScore = left.hits + left.blocked + left.redirects + left.errors;
      const rightScore = right.hits + right.blocked + right.redirects + right.errors;
      return rightScore - leftScore;
    });

  const mostActiveRoute = byRoute.length > 0 ? byRoute[0].route : null;

  return {
    totalRouteEvents: windowed.length,
    navigationStarts,
    navigationEnds,
    routeChanges,
    redirects,
    blocked,
    warnings,
    errors,
    loadStarts,
    loadEnds,
    pendingNavigations: pendingTargets.size,
    avgLoadMs: averageLoadMs,
    maxLoadMs,
    currentRoute,
    mostActiveRoute,
    byRoute
  };
}

type IssueSeverity = "error" | "warn";

function isIssueEvent(event: DevtoolsEventLike): boolean {
  const level = (event as DevtoolsEventLike & { level?: unknown }).level;

  return event.type.startsWith("error:")
    || event.type.includes("warn")
    || event.type.includes("hydration")
    || event.type === "route:blocked"
    || level === "error"
    || level === "warn";
}

function resolveIssueSeverity(event: DevtoolsEventLike): IssueSeverity {
  const level = (event as DevtoolsEventLike & { level?: unknown }).level;
  if (level === "error" || event.type.startsWith("error:")) {
    return "error";
  }

  return "warn";
}

function readIssueMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return safeString(payload);
  }

  const record = payload as Record<string, unknown>;
  const message = record.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message.trim();
  }

  const likelyCause = record.likelyCause;
  if (typeof likelyCause === "string" && likelyCause.trim().length > 0) {
    return likelyCause.trim();
  }

  const reason = record.reason;
  if (typeof reason === "string" && reason.trim().length > 0) {
    return reason.trim();
  }

  return safeString(payload);
}

function normalizeMessageForFingerprint(message: string): string {
  return message
    .replaceAll(/\b\d+\b/g, "#")
    .replaceAll(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function createIssueBucketLabel(index: number, bucketCount: number, windowMs: number): string {
  if (index >= bucketCount - 1) {
    return "now";
  }

  const bucketDuration = windowMs / bucketCount;
  const seconds = Math.max(1, Math.round((windowMs - ((index + 1) * bucketDuration)) / 1000));
  return `-${seconds}s`;
}

export function computeIssueMetrics(
  events: DevtoolsEventLike[],
  windowMs = 60000,
  bucketCount = 8
): IssueMetrics {
  const safeWindowMs = Number.isFinite(windowMs) && windowMs > 0 ? Math.round(windowMs) : 60000;
  const safeBucketCount = Number.isFinite(bucketCount) && bucketCount > 0 ? Math.round(bucketCount) : 8;
  const latestTimestamp = events.length > 0 ? events[events.length - 1].timestamp : Date.now();
  const windowStart = latestTimestamp - safeWindowMs;
  const bucketDuration = safeWindowMs / safeBucketCount;

  const buckets: IssueBucketMetric[] = Array.from({ length: safeBucketCount }, (_, index) => ({
    index,
    label: createIssueBucketLabel(index, safeBucketCount, safeWindowMs),
    count: 0,
    errors: 0,
    warns: 0
  }));

  const issueEvents = events.filter((event) => isIssueEvent(event) && event.timestamp >= windowStart);

  if (issueEvents.length === 0) {
    return {
      windowMs: safeWindowMs,
      totalIssues: 0,
      errorCount: 0,
      warnCount: 0,
      uniqueIssueFingerprints: 0,
      issueRatePerMinute: 0,
      lastIssueAt: null,
      spikeDetected: false,
      byType: [],
      byFingerprint: [],
      buckets
    };
  }

  const byType = new Map<string, IssueTypeMetric>();
  const byFingerprint = new Map<string, IssueFingerprintMetric>();
  let errorCount = 0;
  let warnCount = 0;

  for (const event of issueEvents) {
    const severity = resolveIssueSeverity(event);
    const message = readIssueMessage(event.payload).slice(0, 220);
    const normalizedMessage = normalizeMessageForFingerprint(message);
    const fingerprint = `${event.type}|${normalizedMessage}`;

    if (severity === "error") {
      errorCount += 1;
    } else {
      warnCount += 1;
    }

    const typeMetric = byType.get(event.type) ?? {
      type: event.type,
      count: 0,
      errors: 0,
      warns: 0
    };
    typeMetric.count += 1;
    if (severity === "error") {
      typeMetric.errors += 1;
    } else {
      typeMetric.warns += 1;
    }
    byType.set(event.type, typeMetric);

    const fingerprintMetric = byFingerprint.get(fingerprint) ?? {
      fingerprint,
      type: event.type,
      message,
      count: 0,
      severity,
      lastSeenAt: event.timestamp
    };

    fingerprintMetric.count += 1;
    fingerprintMetric.lastSeenAt = Math.max(fingerprintMetric.lastSeenAt, event.timestamp);
    if (fingerprintMetric.severity !== "error" && severity === "error") {
      fingerprintMetric.severity = "error";
    }
    if (message.length > 0) {
      fingerprintMetric.message = message;
    }
    byFingerprint.set(fingerprint, fingerprintMetric);

    const elapsed = Math.max(0, event.timestamp - windowStart);
    const bucketIndex = Math.min(
      safeBucketCount - 1,
      Math.floor(elapsed / bucketDuration)
    );

    const bucket = buckets[bucketIndex];
    bucket.count += 1;
    if (severity === "error") {
      bucket.errors += 1;
    } else {
      bucket.warns += 1;
    }
  }

  const typeMetrics = Array.from(byType.values()).sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    if (right.errors !== left.errors) return right.errors - left.errors;
    return left.type.localeCompare(right.type);
  });

  const fingerprintMetrics = Array.from(byFingerprint.values()).sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    if (right.lastSeenAt !== left.lastSeenAt) return right.lastSeenAt - left.lastSeenAt;
    return left.fingerprint.localeCompare(right.fingerprint);
  });

  const issueRatePerMinute = Number((issueEvents.length / (safeWindowMs / 60000)).toFixed(2));
  const lastBucketCount = buckets[buckets.length - 1]?.count ?? 0;
  const baselineValues = buckets.slice(0, -1).map((bucket) => bucket.count);
  const baselineAverage = baselineValues.length > 0
    ? baselineValues.reduce((total, value) => total + value, 0) / baselineValues.length
    : 0;

  const spikeDetected = lastBucketCount >= 3
    && (
      (baselineAverage > 0 && lastBucketCount >= baselineAverage * 1.8 && (lastBucketCount - baselineAverage) >= 2)
      || (baselineAverage === 0 && lastBucketCount >= 4)
    );

  return {
    windowMs: safeWindowMs,
    totalIssues: issueEvents.length,
    errorCount,
    warnCount,
    uniqueIssueFingerprints: fingerprintMetrics.length,
    issueRatePerMinute,
    lastIssueAt: issueEvents[issueEvents.length - 1]?.timestamp ?? null,
    spikeDetected,
    byType: typeMetrics,
    byFingerprint: fingerprintMetrics,
    buckets
  };
}