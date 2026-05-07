declare module "virtual:vue-vapor-framework-benchmark" {
  export function render(ctx: { values: number[] }): unknown;
}

declare module "virtual:vue-vapor-route-benchmark" {
  export function render(ctx: { route: Record<string, string> }): unknown;
}