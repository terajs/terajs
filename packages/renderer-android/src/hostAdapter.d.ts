import type { RendererHost } from "@terajs/renderer";
export type AndroidViewHostNode = {
    type: string;
    props: Record<string, unknown>;
    children: AndroidViewHostNode[];
    parent: AndroidViewHostNode | null;
};
/** Minimal imperative host surface for the current Android Views renderer stub. */
export type AndroidViewHostAdapter = Pick<RendererHost<AndroidViewHostNode>, "createElement" | "insert" | "remove" | "setProp">;
/** In-memory Android host used to validate the shared renderer contract from JS. */
export declare const AndroidViewAdapter: AndroidViewHostAdapter;
//# sourceMappingURL=hostAdapter.d.ts.map