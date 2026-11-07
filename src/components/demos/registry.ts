import type { ComponentType } from "react";
import { IdempotencyDemo } from "./IdempotencyDemo";
import { LedgerDemo } from "./LedgerDemo";
import { AtomicDemo } from "./AtomicDemo";
import { OptimisticLockDemo } from "./OptimisticLockDemo";
import { RetryJitterDemo } from "./RetryJitterDemo";
import { CircuitBreakerDemo } from "./CircuitBreakerDemo";
import { DeadLetterDemo } from "./DeadLetterDemo";
import { OutboxDemo } from "./OutboxDemo";
import { RateLimitDemo } from "./RateLimitDemo";
import { BackpressureDemo } from "./BackpressureDemo";
import { BatchDemo } from "./BatchDemo";
import { LockOrderingDemo } from "./LockOrderingDemo";
import { TicksDemo } from "./TicksDemo";
import { EventSourcingDemo } from "./EventSourcingDemo";
import { CacheDemo } from "./CacheDemo";
import { ReplayDemo } from "./ReplayDemo";
import { TenancyDemo } from "./TenancyDemo";
import { VigilDemo } from "./VigilDemo";
import { IntentDemo } from "./IntentDemo";
import { ObserverDemo } from "./ObserverDemo";

/** Maps a Pattern Lab entry's `demo` key to its live demo. */
export const demos: Record<string, ComponentType> = {
  idempotency: IdempotencyDemo,
  ledger: LedgerDemo,
  atomic: AtomicDemo,
  optimistic: OptimisticLockDemo,
  retry: RetryJitterDemo,
  breaker: CircuitBreakerDemo,
  dlq: DeadLetterDemo,
  outbox: OutboxDemo,
  ratelimit: RateLimitDemo,
  backpressure: BackpressureDemo,
  batch: BatchDemo,
  locks: LockOrderingDemo,
  ticks: TicksDemo,
  events: EventSourcingDemo,
  cache: CacheDemo,
  replay: ReplayDemo,
  tenancy: TenancyDemo,
  vigil: VigilDemo,
  intent: IntentDemo,
  observer: ObserverDemo,
};
