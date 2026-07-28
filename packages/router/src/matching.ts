import type { RouteDefinition } from "./definition.js";
import type { RouteMatch, RouteParams, RouteQuery } from "./runtime.js";

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized.length > 1 && normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
}

function splitSegments(pathname: string): string[] {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") {
    return [];
  }

  return normalized.slice(1).split("/").filter(Boolean);
}

function scoreRoutePath(path: string): number {
  return splitSegments(path).reduce((score, segment) => {
    if (segment.startsWith(":")) {
      return score + 2;
    }

    return score + 10;
  }, 0);
}

export function parseTarget(target: string): {
  pathname: string;
  fullPath: string;
  query: RouteQuery;
  hash: string;
} {
  const url = new URL(target, "https://terajs.local");
  const pathname = normalizePathname(url.pathname);
  const query: RouteQuery = {};

  url.searchParams.forEach((value, key) => {
    const previous = query[key];
    if (previous === undefined) {
      query[key] = value;
      return;
    }

    query[key] = Array.isArray(previous) ? [...previous, value] : [previous, value];
  });

  return {
    pathname,
    fullPath: `${pathname}${url.search}${url.hash}`,
    query,
    hash: url.hash ? url.hash.slice(1) : ""
  };
}

function matchPath(pattern: string, pathname: string): RouteParams | null {
  const patternSegments = splitSegments(pattern);
  const pathSegments = splitSegments(pathname);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];
    const pathSegment = pathSegments[index];

    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

function matchPathPrefix(pattern: string, pathname: string): RouteParams | null {
  const patternSegments = splitSegments(pattern);
  const pathSegments = splitSegments(pathname);

  if (patternSegments.length === 0 || patternSegments.length > pathSegments.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];
    const pathSegment = pathSegments[index];

    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

function joinRoutePath(parentPath: string, childPath: string): string {
  if (childPath.startsWith("/")) {
    return normalizePathname(childPath);
  }

  const parent = normalizePathname(parentPath);
  const child = childPath.replace(/^\/+/, "");
  if (!child) {
    return parent;
  }

  return parent === "/" ? `/${child}` : `${parent}/${child}`;
}

interface NormalizedRouteEntry {
  route: RouteDefinition;
  index: number;
  explicitParent?: NormalizedRouteEntry;
}

function flattenRoutes(routes: RouteDefinition[]): NormalizedRouteEntry[] {
  const entries: NormalizedRouteEntry[] = [];
  let index = 0;

  const visit = (route: RouteDefinition, parent?: NormalizedRouteEntry) => {
    const normalizedRoute = parent && !route.path.startsWith("/")
      ? { ...route, path: joinRoutePath(parent.route.path, route.path) }
      : route;
    const entry = { route: normalizedRoute, index: index++, explicitParent: parent };
    entries.push(entry);

    for (const child of route.children ?? []) {
      visit(child, entry);
    }
  };

  for (const route of routes) {
    visit(route);
  }

  return entries;
}

export function resolveComponentStack(route: RouteDefinition): any[] {
  const stack: any[] = [];

  if (route.layout) {
    stack.push(route.layout);
  }

  stack.push(route.component);
  return stack;
}

function createMatch(
  route: RouteDefinition,
  parsedTarget: ReturnType<typeof parseTarget>,
  params: RouteParams
): RouteMatch {
  return {
    route,
    pathname: parsedTarget.pathname,
    fullPath: parsedTarget.fullPath,
    params,
    query: parsedTarget.query,
    hash: parsedTarget.hash,
    componentStack: resolveComponentStack(route)
  };
}

function createBranchMatch(
  route: RouteDefinition,
  parsedTarget: ReturnType<typeof parseTarget>,
  params: RouteParams
): RouteMatch {
  const patternSegments = splitSegments(route.path);
  const targetSegments = splitSegments(parsedTarget.pathname);
  const branchPathname = patternSegments.length === 0
    ? "/"
    : `/${targetSegments.slice(0, patternSegments.length).join("/")}`;

  return {
    route,
    pathname: branchPathname,
    fullPath: `${branchPathname}${parsedTarget.hash ? `#${parsedTarget.hash}` : ""}`,
    params,
    query: parsedTarget.query,
    hash: parsedTarget.hash,
    componentStack: resolveComponentStack(route)
  };
}

function buildExplicitBranch(
  leaf: NormalizedRouteEntry,
  parsedTarget: ReturnType<typeof parseTarget>
): RouteMatch[] {
  const entries: NormalizedRouteEntry[] = [];
  let current: NormalizedRouteEntry | undefined = leaf;

  while (current) {
    entries.unshift(current);
    current = current.explicitParent;
  }

  return entries.flatMap((entry) => {
    const params = matchPathPrefix(entry.route.path, parsedTarget.pathname);
    return params ? [createBranchMatch(entry.route, parsedTarget, params)] : [];
  });
}

function buildPathDerivedBranch(
  entries: NormalizedRouteEntry[],
  leaf: NormalizedRouteEntry,
  parsedTarget: ReturnType<typeof parseTarget>
): RouteMatch[] {
  const leafSegmentCount = splitSegments(leaf.route.path).length;
  const byDepth = new Map<number, { entry: NormalizedRouteEntry; params: RouteParams; score: number }>();

  for (const entry of entries) {
    const segmentCount = splitSegments(entry.route.path).length;
    if (segmentCount === 0 || segmentCount >= leafSegmentCount) {
      continue;
    }

    const params = matchPathPrefix(entry.route.path, parsedTarget.pathname);
    if (!params) {
      continue;
    }

    const score = scoreRoutePath(entry.route.path);
    const existing = byDepth.get(segmentCount);
    if (!existing || score > existing.score || (score === existing.score && entry.index < existing.entry.index)) {
      byDepth.set(segmentCount, { entry, params, score });
    }
  }

  return [...byDepth.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, candidate]) => createBranchMatch(candidate.entry.route, parsedTarget, candidate.params));
}

export function matchRoute(routes: RouteDefinition[], target: string): RouteMatch | null {
  const parsedTarget = parseTarget(target);
  const normalizedRoutes = flattenRoutes(routes);

  const candidates = normalizedRoutes
    .map((entry) => {
      const params = matchPath(entry.route.path, parsedTarget.pathname);
      if (!params) {
        return null;
      }

      return {
        entry,
        index: entry.index,
        score: scoreRoutePath(entry.route.path),
        params
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.index - right.index;
    });

  const selected = candidates[0];
  if (!selected) {
    return null;
  }

  const explicitBranch = buildExplicitBranch(selected.entry, parsedTarget);
  const parentBranch = explicitBranch.length > 1
    ? explicitBranch.slice(0, -1)
    : buildPathDerivedBranch(normalizedRoutes, selected.entry, parsedTarget);
  const leafMatch = createMatch(selected.entry.route, parsedTarget, selected.params);

  return {
    ...leafMatch,
    branch: [...parentBranch, leafMatch]
  };
}
