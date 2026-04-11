# Terajs Reactivity System

Terajs's reactivity system is fine-grained, fast, and designed for DX. It powers all state, computed, and effect logic in Terajs apps.

---

## Core Concepts

### 1. Signals
A signal is a reactive value. It tracks reads and notifies dependents on change.

```ts
import { signal } from '@terajs/reactivity';

const count = signal(0);

console.log(count()); // 0
count.set(1);
console.log(count()); // 1
```

### 2. Effects
An effect runs a function whenever its dependencies change.

```ts
import { effect } from '@terajs/reactivity';

effect(() => {
  console.log('Count is', count());
});

count.set(2); // logs: Count is 2
```

### 3. Computed
A computed is a lazily-evaluated, cached derived value.

```ts
import { computed } from '@terajs/reactivity';

const double = computed(() => count() * 2);
console.log(double.get()); // 4 if count is 2
```

### 4. Reactive Objects
Deeply reactive objects, where each property is a signal.

```ts
import { reactive } from '@terajs/reactivity';

const user = reactive({ name: 'Gabriel', age: 42 });
effect(() => console.log(user.name));
user.name = 'Bro'; // triggers effect
```

---

## Advanced

- **Ref**: For mutable references.
- **State**: For simple stateful values.
- **Watch/WatchEffect**: For side effects and subscriptions.
- **Cleanup/Dispose**: For effect cleanup and resource management.

---

## Debugging & DevTools
- All signals, effects, and computed values emit debug events for live inspection in Terajs DevTools.
- The dependency graph is visualized in the devtools overlay.

---

## Example: Todo List

```ts
import { signal, effect } from '@terajs/reactivity';

const todos = signal(['Learn Terajs']);
effect(() => {
  console.log('Todos:', todos());
});
todos.set([...todos(), 'Build something cool']);
```

---

## API Reference
- `signal<T>(value: T): Signal<T>`
- `effect(fn: () => void): void`
- `computed<T>(fn: () => T): Computed<T>`
- `reactive<T extends object>(obj: T): T`
- `ref<T>(value: T): Ref<T>`
- `state<T>(value: T): State<T>`
- `watch(fn, options?)`
- `watchEffect(fn, options?)`
- `dispose(fn)`

---

See the source for more advanced patterns and DX utilities.

