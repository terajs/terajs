export interface ServerRequestInfo {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}

export interface ServerContext {
  request?: ServerRequestInfo;
  locals?: Record<string, unknown>;
  env?: Record<string, unknown>;
  services?: Record<string, unknown>;
}