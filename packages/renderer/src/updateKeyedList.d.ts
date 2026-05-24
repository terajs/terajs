export interface KeyedItem<NodeLike = Node> {
    key: any;
    node: NodeLike;
}
export type MountFn<ParentLike = Node, NodeLike = Node, ItemLike extends KeyedItem<NodeLike> = KeyedItem<NodeLike>> = (item: ItemLike, parent: ParentLike, anchor: ItemLike["node"] | null) => void;
export type UnmountFn<ParentLike = Node, NodeLike = Node, ItemLike extends KeyedItem<NodeLike> = KeyedItem<NodeLike>> = (item: ItemLike, parent: ParentLike) => void;
export type MoveFn<ParentLike = Node, NodeLike = Node, ItemLike extends KeyedItem<NodeLike> = KeyedItem<NodeLike>> = (item: ItemLike, parent: ParentLike, anchor: ItemLike["node"] | null) => void;
export declare function updateKeyedList<ParentLike, NodeLike, ItemLike extends KeyedItem<NodeLike>>(parent: ParentLike, oldItems: ItemLike[], newItems: ItemLike[], mount: MountFn<ParentLike, NodeLike, ItemLike>, unmount: UnmountFn<ParentLike, NodeLike, ItemLike>, move: MoveFn<ParentLike, NodeLike, ItemLike>): void;
//# sourceMappingURL=updateKeyedList.d.ts.map