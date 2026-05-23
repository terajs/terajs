declare module "*.tera" {
  const component: (props?: any) => Node;
  export default component;
}

declare module "virtual:terajs-routes" {
  const routes: any[];
  export { routes };
}

declare module "virtual:terajs-app" {
  const app: (props?: any) => Node;
  export default app;
  export function bootstrapTerajsApp(): void;
}