import type { LoadedRouteMatch } from "./loading.js";
import type { RouteMatch } from "./runtime.js";

export interface RouteBranchDebugEntry {
  id: string;
  path: string;
  pathname: string;
  filePath: string;
  params: RouteMatch["params"];
}

export function summarizeRouteBranch(match: RouteMatch): RouteBranchDebugEntry[] {
  const branch = match.branch && match.branch.length > 0 ? match.branch : [match];

  return branch.map((entry) => ({
    id: entry.route.id,
    path: entry.route.path,
    pathname: entry.pathname,
    filePath: entry.route.filePath,
    params: entry.params
  }));
}

export function summarizeLoadedRouteBranch(loaded: LoadedRouteMatch<unknown>): RouteBranchDebugEntry[] {
  const branch = loaded.branch && loaded.branch.length > 0
    ? loaded.branch.map((entry) => entry.match)
    : [loaded.match];

  return branch.map((entry) => ({
    id: entry.route.id,
    path: entry.route.path,
    pathname: entry.pathname,
    filePath: entry.route.filePath,
    params: entry.params
  }));
}
