/**
 * Standard error structure for Terajs SFC compilation issues.
 */
export interface SfcError {
  code: string;
  message: string;
  line: number;
  column: number;
  file: string;
  snippet?: string;
}

export function createSfcError(
  message: string,
  line: number,
  column: number,
  file: string,
  source: string
): SfcError {
  const lines = source.split("\n");
  return {
    code: "TERA_PARSE_ERROR",
    message,
    line,
    column,
    file,
    snippet: lines[line - 1]?.trim()
  };
}
