---
title: Nothing Ticks: Building a Game World That Survives a Restart
summary: Most strategy games run a loop that pushes the whole world forward every second. Mine doesn't have one. Here's how deriving state from timestamps made the server simpler, cheaper and impossible to desync.
date: 2026-11-03
order: 7
tags: System design, Games, PostgreSQL
---

Your mum puts a pot of jollof on the stove and says, "it will be ready by 2:30." Then she leaves the kitchen. She does not stand over the pot counting seconds. She does not need to. At 2:15, if you ask her whether the rice is done, she does not run to check. She looks at the clock and says "fifteen more minutes."

She is not *tracking* the rice. She is *deriving* it.

Hold on to that pot. It is the whole article.

In this article, you will learn

- Why the "game loop" design for persistent worlds is fragile.
- How to model state as *when things started* instead of *what they are right now*.
- How to "settle" derived state before you change it.
- Why this makes testing dramatically easier.
- The one place where you genuinely do need a clock.

## THE LOOP THAT RUNS THE WORLD

I am building Street Kings, a persistent multiplayer strategy game. Every player has a city. Farms produce food. Quarries produce stone. Buildings take hours to upgrade. Armies march across a map and arrive at a set time.

The obvious way to build this is a loop. Every second (or every minute), a background job wakes up, walks every city in the database, adds production, advances timers, and saves everything.

```js
// The obvious approach. Please don't.
setInterval(async () => {
  for (const city of await City.findAll()) {
    city.food += city.foodPerSecond;
    city.stone += city.stonePerSecond;
    if (city.upgradeEndsAt <= Date.now()) city.level += 1;
    await city.save();
  }
}, 1000);
```

This works on your laptop with five test cities. Then reality shows up:

1. **It costs you for nothing.** Ninety-five percent of cities are owned by players who are asleep. You are writing their rows every second anyway.
2. **It is fragile.** If the process restarts, the world pauses. When it comes back, did it miss forty seconds of production? Does it catch up? How?
3. **It does not scale out.** Run two copies of the server and the loop runs twice. Now everybody's farms are twice as productive. Your players will love this. Your economy will not.
4. **It is hard to test.** To test "an upgrade finishes after two hours," you either wait two hours or start mocking timers inside a loop inside a job.

## STORE WHEN, NOT WHAT

So instead, Street Kings has no world loop at all. The rule, written at the top of the architecture document, is three words long:

> NOTHING TICKS.

The world stores *when something started and when it will be done*, and the present is calculated on read. Just like the jollof.

| Thing | What we store | What we derive on read |
| --- | --- | --- |
| Resources | Amount at `settled_at` | Amount now = stored + production since then, capped by storage |
| Buildings | `level` and `ready_at` | Working level (still the old level until `ready_at` passes) |
| Units in training | Batch with `ready_at` | At home once `ready_at` has passed |
| Armies | Departure, arrival, return times | Marching, arrived, returning or home |

Here is resource production, written as a pure function:

```ts
type Stock = { amount: number; settledAt: Date; ratePerHour: number; capacity: number };

export function stockAt(stock: Stock, now: Date): number {
  const hours = Math.max(0, (now.getTime() - stock.settledAt.getTime()) / 3_600_000);
  const produced = Math.floor(stock.ratePerHour * hours);
  return Math.min(stock.capacity, stock.amount + produced);
}
```

No timers. No jobs. No writes. When a player opens their city at 2:15, we look at the clock and work out how much food they have. The same way mum knows the rice needs fifteen minutes.

The payoff is huge. A server can crash and restart, or a second server can start beside it, and **every answer is identical**, because the answer is a function of stored facts and the current time. There is nothing to "catch up."

## SETTLE BEFORE YOU CHANGE ANYTHING

There is a catch, and it is an important one. What happens when the *rate* changes?

Say a player has a farm producing 100 food per hour, settled at 9:00. At 11:00 they upgrade it to 200 per hour. If we just update `ratePerHour` to 200, then at noon our function will happily calculate three hours × 200 = 600 food. But for the first two hours, the farm was only producing 100. We just invented 200 food.

The fix is a rule I apply to every single mutation:

> SETTLE FIRST. WRITE THE DERIVED PRESENT DOWN, THEN APPLY THE CHANGE.

```ts
async function upgradeFarm(db: Db, cityId: string, now: Date) {
  await withLockedCity(db, cityId, async (tx, city) => {
    // 1. Settle: turn "derived" into "stored" as of right now.
    const food = stockAt(city.food, now);
    await tx.query(
      "UPDATE stocks SET amount = $1, settled_at = $2 WHERE city_id = $3 AND resource = 'food'",
      [food, now, cityId],
    );

    // 2. Only now is it safe to change the rate.
    await tx.query("UPDATE buildings SET level = level + 1 WHERE city_id = $1 AND kind = 'farm'", [cityId]);
  });
}
```

Settling moves the starting line up to "now," so the new rate only applies from this moment forward. It all happens in one transaction, under a lock on the city, so two requests cannot settle the same city at the same time and double-count. (Locking two cities at once is its own adventure, I wrote about [lock ordering](/writing/two-locks-one-deadlock) separately.)

## TESTS THAT CONTROL TIME

This is my favourite consequence. Because every rule takes `now` as an input, time is just a parameter. The whole app is built from a database pool and a **clock function**:

```ts
export function buildApp({ pool, clock = () => new Date() }: { pool: Pool; clock?: () => Date }) {
  // every route reads clock(), never new Date()
}
```

In tests, I pass a fake clock and move it forward whenever I like:

```ts
let now = new Date("2026-10-01T09:00:00Z");
const app = buildApp({ pool: testPool, clock: () => now });

await request(app).post("/api/buildings/farm/upgrade").expect(200);
now = new Date("2026-10-01T11:00:01Z"); // two hours later, instantly
const city = await request(app).get("/api/city").expect(200);
expect(city.body.buildings.farm.level).toBe(2);
```

Two hours pass in one line. Real HTTP stack, real database, no mocked timers, no flaky sleeps.

## THE ONE PLACE THAT DOES TICK

I would be lying if I said nothing *anywhere* ticks. Street Kings has a live arena: real-time battles where squads move and fight while players watch. You cannot derive a live fight from timestamps, because players keep sending new orders. Something has to advance the simulation.

So the arena is the exception, and it is walled off on purpose. It is the only module with a clock (it runs at 10 ticks per second), the only one that keeps its state in memory instead of in Postgres, and it never reaches into the world's tables mid-match. When a match ends, the result is written once, and the rest of the world goes back to being timeless.

That is the lesson I would actually take away from this:

> MAKE THE CLOCK THE EXCEPTION, NOT THE FOUNDATION.

## WHEN SHOULD YOU USE THIS?

You do not need to be building a game. This shape shows up everywhere:

1. **Subscriptions**: store `started_at` and `period`; derive "is active" on read instead of running a nightly job to flip flags.
2. **Interest and accruals**: store principal and `settled_at`; settle before every deposit or withdrawal.
3. **SLAs and timers**: store `opened_at`; derive "overdue" when you need to know.
4. **Rate limits**. Token buckets are exactly this pattern: store tokens at last refill, derive the current count.

Whenever you catch yourself writing a cron job whose only purpose is to *update a value because time passed*, stop and ask: could I just store when it started and work out the rest?

Mum never stood over the pot. Your server shouldn't either.
