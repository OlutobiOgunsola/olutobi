---
title: Double-Entry Bookkeeping for Developers Who Hate Accounting
summary: A balance column is an opinion. A ledger is evidence. Here's the 500-year-old idea that makes money impossible to lose quietly, explained with an esusu collector and a few SQL tables.
date: 2026-11-03
order: 3
tags: Ledgers, Fintech, Databases
---

Every market has an *alajo*, the esusu collector. Every day, traders hand him a little money for safekeeping, and at the end of the month he pays it all back, minus his small fee. He carries a worn notebook everywhere.

Here is the thing about that notebook. It does not say "Iya Femi: ₦47,000." It says:

*Monday: Iya Femi gave ₦2,000.*
*Tuesday: Iya Femi gave ₦2,000.*
*Friday: Iya Femi collected ₦10,000 early for school fees.*

The balance is never written down. It is *worked out* from the entries. And if Iya Femi ever says "I'm sure I gave you ₦4,000 on Tuesday," he can open the notebook and they can both look.

The alajo has been doing event sourcing for centuries. Let us steal his idea, and then improve it.

In this article, you will learn

- Why a `balance` column is a liability.
- What "double-entry" actually means, without the accounting jargon.
- How to model it with two tables.
- How to post real transactions, like an estate levy and its payment.
- How to make webhooks post exactly once.

## THE BALANCE COLUMN

A great many apps store money like this:

```sql
UPDATE wallets SET balance = balance + 5000 WHERE id = 42;
```

It is fast and simple. And the moment it is wrong, it is wrong *forever*, with no trail. Was it a double-processed webhook? A refund applied twice? A manual fix somebody ran in production in 2023? The column cannot tell you. It just has a number, and the number is an opinion.

> A BALANCE COLUMN IS AN OPINION. A LEDGER IS EVIDENCE.

## THE IDEA IN ONE SENTENCE

Double-entry bookkeeping says: **money never appears or disappears; it only moves from one account to another.** So every transaction is recorded as at least two entries (one account goes down, another goes up), and the entries for a transaction always sum to zero.

Accountants call the two sides *debit* and *credit*, and they have conventions about which accounts go up on which side that I will not bore you with. For us developers, a simpler model works: every entry has a **signed amount**, and the amounts in a transaction must add up to zero.

## TWO TABLES

```sql
CREATE TABLE accounts (
  id       BIGSERIAL PRIMARY KEY,
  estate_id BIGINT NOT NULL,
  code     TEXT NOT NULL,        -- 'cash', 'dues_receivable', 'levy_income', 'resident:flat-4b'
  kind     TEXT NOT NULL CHECK (kind IN ('asset', 'liability', 'income', 'expense', 'equity')),
  UNIQUE (estate_id, code)
);

CREATE TABLE ledger_entries (
  id             BIGSERIAL PRIMARY KEY,
  transaction_id UUID NOT NULL,
  account_id     BIGINT NOT NULL REFERENCES accounts(id),
  amount_kobo    BIGINT NOT NULL CHECK (amount_kobo <> 0),
  memo           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

(Yes, `amount_kobo` is a `BIGINT`. I wrote [a whole article](/writing/your-naira-has-two-decimal-places) about why.)

A balance is now never stored. It is a query:

```sql
SELECT a.code, SUM(e.amount_kobo) AS balance_kobo
FROM accounts a
JOIN ledger_entries e ON e.account_id = a.id
WHERE a.estate_id = $1
GROUP BY a.code;
```

Just like the alajo's notebook. If you need it fast at scale, you can cache or snapshot balances later, but the entries remain the truth, and any snapshot can be rebuilt from them.

## POSTING A REAL TRANSACTION

In Sentinel, the estate management platform I am building, estate admins set levies: security dues, waste collection, the generator diesel contribution everybody argues about. Residents pay them online.

That is two events, and each one is a balanced transaction:

**1. The levy is issued.** The estate is now owed money it has earned.

| Account | Amount |
| --- | --- |
| dues_receivable | +₦25,000 |
| levy_income | −₦25,000 |

**2. The resident pays.** Cash comes in; the amount owed goes down.

| Account | Amount |
| --- | --- |
| cash | +₦25,000 |
| dues_receivable | −₦25,000 |

Each transaction sums to zero. And look at what we get for free: `dues_receivable` is now exactly the total amount residents still owe, and grouping its entries by resident gives you the defaulters list. Nobody typed that number in. It fell out of the model.

The code that posts a transaction refuses to write anything unbalanced:

```js
async function post(tx, { estateId, entries, memo }) {
  const sum = entries.reduce((s, e) => s + BigInt(e.amountKobo), 0n);
  if (sum !== 0n) throw new Error(`Unbalanced transaction: off by ${sum} kobo`);

  const transactionId = crypto.randomUUID();
  for (const e of entries) {
    const account = await accountByCode(tx, estateId, e.account);
    await tx.ledgerEntry.create({
      data: { transactionId, accountId: account.id, amountKobo: e.amountKobo, memo },
    });
  }
  return transactionId;
}
```

All the entries go in inside one database transaction. Either the whole thing balances and commits, or nothing is written.

## THE TRIAL BALANCE: A FREE CORRECTNESS CHECK

Because every transaction sums to zero, **all entries across the whole ledger must also sum to zero.** Accountants call this the trial balance, and it is the best health check you will ever write:

```sql
SELECT SUM(amount_kobo) AS should_be_zero FROM ledger_entries
JOIN accounts ON accounts.id = ledger_entries.account_id
WHERE accounts.estate_id = $1;
```

If that number is ever not zero, something wrote an unbalanced transaction, and you know immediately, not at month-end, not when a resident complains.

## FIXING MISTAKES WITHOUT ERASING THEM

The alajo never tears a page out of his notebook. If he wrote ₦2,000 when it was ₦200, he writes a correction underneath.

Do the same. **Ledger entries are never updated or deleted.** A refund is a new transaction that reverses the original. A mistake is corrected with an adjusting entry. The history stays intact, and the audit trail writes itself.

## WEBHOOKS THAT POST EXACTLY ONCE

Online payments arrive by webhook from the payment provider. Webhooks are delivered *at least once*. The provider will happily send you the same "payment successful" event two or three times. If each delivery posts to the ledger, the resident has paid three times on paper and you have invented ₦50,000.

Two rules keep this safe:

1. **Verify the signature first.** The provider signs each webhook with an HMAC using your secret. If the signature does not match, the request is not from the provider, and it is dropped before anything else happens.
2. **Settle on a state transition, exactly once.** The payment row moves from `processing` to `paid` in the same transaction that posts the ledger entries, and only if it is still `processing`:

```js
await db.$transaction(async (tx) => {
  const { count } = await tx.payment.updateMany({
    where: { id: payment.id, status: "processing" },
    data: { status: "paid", paidAt: new Date() },
  });
  if (count === 0) return; // already settled by an earlier delivery. Nothing to do

  await post(tx, {
    estateId: payment.estateId,
    memo: `Levy payment ${payment.reference}`,
    entries: [
      { account: "cash", amountKobo: payment.amountKobo },
      { account: "dues_receivable", amountKobo: -payment.amountKobo },
    ],
  });
});
```

The second and third deliveries find the payment already `paid`, update zero rows, and leave. The ledger is posted exactly once. (If this shape looks familiar, it is because it is the same idea as [making retries boring](/writing/make-retries-boring).)

## WHY BOTHER?

1. **You can always explain a number.** Every balance is a sum of entries, and every entry has a transaction and a memo.
2. **Bugs announce themselves.** An unbalanced write is rejected; a corrupted ledger fails the trial balance.
3. **Reports are queries, not spreadsheets.** Income, receivables, defaulters, cash position: all derived, all live.
4. **Auditors and finance teams already speak this language.** You are building on 500 years of practice, not inventing your own.

The alajo does not have a computer science degree. He has a notebook, a rule, and the trust of the whole market. That is a pretty good architecture.
