import { emitRendererDebug } from "./debug.js";
export function updateKeyedList(parent, oldItems, newItems, mount, unmount, move) {
    emitRendererDebug("list:diff:start", () => ({
        parent,
        oldCount: oldItems.length,
        newCount: newItems.length
    }));
    let index = 0;
    let oldEnd = oldItems.length - 1;
    let newEnd = newItems.length - 1;
    while (index <= oldEnd && index <= newEnd && oldItems[index].key === newItems[index].key) {
        emitRendererDebug("list:diff:sync-start", () => ({
            index,
            key: oldItems[index].key
        }));
        index += 1;
    }
    while (index <= oldEnd && index <= newEnd && oldItems[oldEnd].key === newItems[newEnd].key) {
        emitRendererDebug("list:diff:sync-end", () => ({
            oldIndex: oldEnd,
            newIndex: newEnd,
            key: oldItems[oldEnd].key
        }));
        oldEnd -= 1;
        newEnd -= 1;
    }
    if (index > oldEnd) {
        const anchor = newEnd + 1 < newItems.length ? newItems[newEnd + 1].node : null;
        while (index <= newEnd) {
            emitRendererDebug("list:diff:mount", () => ({
                index,
                key: newItems[index].key,
                anchor
            }));
            mount(newItems[index], parent, anchor);
            index += 1;
        }
        return;
    }
    if (index > newEnd) {
        while (index <= oldEnd) {
            emitRendererDebug("list:diff:unmount", () => ({
                index,
                key: oldItems[index].key
            }));
            unmount(oldItems[index], parent);
            index += 1;
        }
        return;
    }
    const oldStart = index;
    const newStart = index;
    const keyToNewIndex = new Map();
    for (let middleIndex = newStart; middleIndex <= newEnd; middleIndex += 1) {
        keyToNewIndex.set(newItems[middleIndex].key, middleIndex);
    }
    const toMove = new Array(newEnd - newStart + 1).fill(-1);
    let moved = false;
    let maxNewIndexSoFar = 0;
    for (let middleIndex = oldStart; middleIndex <= oldEnd; middleIndex += 1) {
        const oldItem = oldItems[middleIndex];
        const newIndex = keyToNewIndex.get(oldItem.key);
        if (newIndex == null) {
            emitRendererDebug("list:diff:unmount", () => ({
                index: middleIndex,
                key: oldItem.key
            }));
            unmount(oldItem, parent);
        }
        else {
            toMove[newIndex - newStart] = middleIndex;
            if (newIndex < maxNewIndexSoFar) {
                moved = true;
            }
            else {
                maxNewIndexSoFar = newIndex;
            }
        }
    }
    if (!moved) {
        for (let middleIndex = newEnd; middleIndex >= newStart; middleIndex -= 1) {
            if (toMove[middleIndex - newStart] === -1) {
                const anchor = middleIndex + 1 < newItems.length ? newItems[middleIndex + 1].node : null;
                emitRendererDebug("list:diff:mount", () => ({
                    index: middleIndex,
                    key: newItems[middleIndex].key,
                    anchor
                }));
                mount(newItems[middleIndex], parent, anchor);
            }
        }
        return;
    }
    const sequence = longestIncreasingSubsequence(toMove);
    emitRendererDebug("list:diff:lis", () => ({
        toMove,
        lis: sequence
    }));
    let sequenceIndex = sequence.length - 1;
    for (let middleIndex = newEnd; middleIndex >= newStart; middleIndex -= 1) {
        const newItem = newItems[middleIndex];
        const anchor = middleIndex + 1 < newItems.length ? newItems[middleIndex + 1].node : null;
        if (toMove[middleIndex - newStart] === -1) {
            emitRendererDebug("list:diff:mount", () => ({
                index: middleIndex,
                key: newItem.key,
                anchor
            }));
            mount(newItem, parent, anchor);
        }
        else if (sequenceIndex < 0 || middleIndex - newStart !== sequence[sequenceIndex]) {
            emitRendererDebug("list:diff:move", () => ({
                index: middleIndex,
                key: newItem.key,
                anchor
            }));
            move(newItem, parent, anchor);
        }
        else {
            sequenceIndex -= 1;
        }
    }
}
function longestIncreasingSubsequence(values) {
    const previous = values.slice();
    const result = [];
    let start;
    let end;
    for (let index = 0; index < values.length; index += 1) {
        const value = values[index];
        if (value === -1) {
            continue;
        }
        if (result.length === 0 || values[result[result.length - 1]] < value) {
            previous[index] = result.length > 0 ? result[result.length - 1] : -1;
            result.push(index);
            continue;
        }
        start = 0;
        end = result.length - 1;
        while (start < end) {
            const middle = ((start + end) / 2) | 0;
            if (values[result[middle]] < value) {
                start = middle + 1;
            }
            else {
                end = middle;
            }
        }
        if (value < values[result[start]]) {
            if (start > 0) {
                previous[index] = result[start - 1];
            }
            result[start] = index;
        }
    }
    start = result.length;
    end = result[result.length - 1];
    while (start-- > 0) {
        result[start] = end;
        end = previous[end];
    }
    return result;
}
