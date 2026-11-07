---
title: Two Locks, One Deadlock: Lock Ordering in PostgreSQL
summary: Two transfers, two rows, two transactions waiting on each other forever. Why deadlocks happen, what Postgres does about them, and the one-line habit that makes them impossible.
date: 2026-11-03
order: 8
tags: PostgreSQL, Concurrency, Backend
---

There is a narrow bridge on a street in Surulere, wide enough for exactly one car. One evening, a danfo drives onto it from the north end. At the same moment, a Camry drives onto it from the south. They meet in the middle.

The danfo driver will not reverse, because he was there first. The Camry driver will not reverse, because *she* was there first. Horns. Hands out of windows. Neither moves. They will be there until somebody from the community comes to pick one of them and make them back up.

Congratulations. You have just seen a deadlock.

In this article, you will learn

- What a deadlock actually is, in database terms.
- How to cause one on purpose with two innocent-looking transfers.
- What PostgreSQL does when it detects one.
- The habit that prevents them: always lock in the same order.
- How I apply it when a game action touches two players' cities at once.

## THE INNOCENT TRANSFER

Let us write the most normal function in the world: move money from one wallet to another. We lock both rows so nobody else changes them mid-transfer.

```js
async function transfer(db, fromId, toId, amountKobo) {
  await db.tx(async (t) => {
    // Lock the sender, then the receiver.
    const from = await t.one("SELECT * FROM wallets WHERE id = $1 FOR UPDATE", [fromId]);
    const to = await t.one("SELECT * FROM wallets WHERE id = $1 FOR UPDATE", [toId]);

    if (from.balance_kobo < amountKobo) throw new InsufficientFundsError();
    await t.none("UPDATE wallets SET balance_kobo = balance_kobo - $1 WHERE id = $2", [amountKobo, fromId]);
    await t.none("UPDATE wallets SET balance_kobo = balance_kobo + $1 WHERE id = $2", [amountKobo, toId]);
  });
}
```

`FOR UPDATE` tells Postgres: "I am about to change this row, so nobody else may lock it until my transaction finishes." Very responsible. Nothing wrong here.

Now Tunde sends Ada ₦5,000 at the exact moment Ada sends Tunde ₦2,000.

```text
Tx 1 (Tunde → Ada):  lock Tunde ✅
Tx 2 (Ada → Tunde):  lock Ada   ✅
Tx 1:                lock Ada   ⏳ waiting for Tx 2…
Tx 2:                lock Tunde ⏳ waiting for Tx 1…
```

Transaction 1 holds Tunde and wants Ada. Transaction 2 holds Ada and wants Tunde. Each one is waiting for the other to finish, and neither can finish until it gets what it is waiting for. That is the danfo and the Camry on the bridge.

> A DEADLOCK IS A CYCLE OF WAITING. NOBODY IS WRONG. EVERYBODY IS STUCK.

## WHAT POSTGRES DOES ABOUT IT

Postgres is the community person who walks onto the bridge. When a transaction has been waiting on a lock for longer than `deadlock_timeout` (one second by default), Postgres checks whether the waiting forms a cycle. If it does, it picks one of the transactions and kills it:

```text
ERROR:  deadlock detected
DETAIL: Process 4821 waits for ShareLock on transaction 99812; blocked by process 4822.
        Process 4822 waits for ShareLock on transaction 99811; blocked by process 4821.
SQLSTATE: 40P01
```

The other transaction carries on and commits. Your data is safe. Nothing is half-written. But one user just got an error for doing something perfectly reasonable, and on a busy system these start showing up in your logs like mosquitoes in rainy season.

You *can* catch `40P01` and retry. You should, as a safety net. But retrying a deadlock is treating the symptom. Let us fix the cause.

## ALWAYS DRIVE ONTO THE BRIDGE FROM THE SAME SIDE

Deadlocks need a cycle. A cycle needs two transactions to grab locks in **opposite orders**. So if every transaction always grabs locks in the **same** order, there can be no cycle.

The simplest consistent order is by ID:

```js
async function transfer(db, fromId, toId, amountKobo) {
  await db.tx(async (t) => {
    // Lock both rows in a fixed order, lowest id first, regardless of direction.
    const [firstId, secondId] = [fromId, toId].sort((a, b) => a - b);
    await t.one("SELECT id FROM wallets WHERE id = $1 FOR UPDATE", [firstId]);
    await t.one("SELECT id FROM wallets WHERE id = $1 FOR UPDATE", [secondId]);

    // Now both are ours. Read and write in whatever order the logic needs.
    const from = await t.one("SELECT balance_kobo FROM wallets WHERE id = $1", [fromId]);
    if (from.balance_kobo < amountKobo) throw new InsufficientFundsError();
    await t.none("UPDATE wallets SET balance_kobo = balance_kobo - $1 WHERE id = $2", [amountKobo, fromId]);
    await t.none("UPDATE wallets SET balance_kobo = balance_kobo + $1 WHERE id = $2", [amountKobo, toId]);
  });
}
```

Replay the race. Say Tunde is wallet 7 and Ada is wallet 12:

```text
Tx 1 (Tunde → Ada):  lock 7  ✅
Tx 2 (Ada → Tunde):  lock 7  ⏳ waiting for Tx 1   (both start with 7!)
Tx 1:                lock 12 ✅ → transfer → COMMIT
Tx 2:                lock 7  ✅, lock 12 ✅ → transfer → COMMIT
```

Transaction 2 waits a few milliseconds. Then it goes. Nobody is killed, nobody gets an error. The bridge has a one-way rule now, and everybody follows it.

Notice I lock first and read the balances *after*. That matters: a balance read before you hold the lock could be stale by the time you act on it.

## WHAT ABOUT `ORDER BY ... FOR UPDATE`?

You may have seen this shortcut:

```sql
SELECT id FROM wallets WHERE id = ANY($1) ORDER BY id FOR UPDATE;
```

It usually locks rows in the sorted order, and for many workloads it is fine. But the order rows are locked in follows how Postgres executes the query, and that is an implementation detail rather than a promise. When correctness depends on it, I prefer to be explicit and lock one row at a time in an order I control. It is two lines longer and it says exactly what it means.

## TWO CITIES AT ONCE

In Street Kings, my multiplayer strategy game, every action that spends or moves anything runs in one transaction that locks the player's city. Most actions touch one city. But battles touch two: the attacker and the defender. A protectorate paying tribute to its protector touches two. Aid from an ally touches two.

And of course, two players can attack each other at the same moment. Danfo, meet Camry.

So the code has exactly one function allowed to lock two cities, and it always locks them in a fixed order:

```ts
export async function lockHeadquartersPair<T>(
  db: Pool,
  a: string,
  b: string,
  fn: (tx: PoolClient) => Promise<T>,
): Promise<T> {
  const [first, second] = a < b ? [a, b] : [b, a];
  return withTransaction(db, async (tx) => {
    await tx.query("SELECT 1 FROM headquarters WHERE id = $1 FOR UPDATE", [first]);
    await tx.query("SELECT 1 FROM headquarters WHERE id = $1 FOR UPDATE", [second]);
    return fn(tx);
  });
}
```

The important part is not the code. It is the *rule*: **nobody else in the codebase is allowed to lock two cities any other way.** One door in, one direction across the bridge.

## THE HABITS

1. **Lock everything you need up front**, before you read values you will act on.
2. **Lock in one global order**, by primary key is the simplest.
3. **Centralise multi-row locking** in one helper so the order cannot drift.
4. **Keep transactions short.** Never call a slow external API while holding a lock.
5. **Still retry on `40P01`** as a safety net, and alert if you see it often. It means somebody bypassed rule 3.

The danfo and the Camry were both right. That is exactly why they were both stuck. Give them a rule, and the bridge just works.
