const LOW_SIGNAL_EVENT_PREFIXES = [
  "binding:",
  "dom:",
  "unwrap:"
];

const LOW_SIGNAL_EVENT_TYPES = new Set([
  "component:context:get",
  "effect:getCurrent",
  "reactive:read",
  "runtime:mode:check"
]);

interface DevtoolsBufferedEventLike {
  type: string;
}

export function retainPrioritizedDevtoolsEvents<TEvent extends DevtoolsBufferedEventLike>(
  events: TEvent[],
  maxEvents: number
): TEvent[] {
  if (events.length <= maxEvents) {
    return events.slice();
  }

  let overflow = events.length - maxEvents;
  const retained: TEvent[] = [];

  for (const event of events) {
    if (overflow > 0 && isLowSignalDevtoolsEvent(event.type)) {
      overflow -= 1;
      continue;
    }

    retained.push(event);
  }

  if (retained.length <= maxEvents) {
    return retained;
  }

  return retained.slice(-maxEvents);
}

export function appendPrioritizedDevtoolsEvent<TEvent extends DevtoolsBufferedEventLike>(
  events: TEvent[],
  event: TEvent,
  maxEvents: number
): TEvent[] {
  return retainPrioritizedDevtoolsEvents([...events, event], maxEvents);
}

function isLowSignalDevtoolsEvent(type: string): boolean {
  if (LOW_SIGNAL_EVENT_TYPES.has(type)) {
    return true;
  }

  return LOW_SIGNAL_EVENT_PREFIXES.some((prefix) => type.startsWith(prefix));
}