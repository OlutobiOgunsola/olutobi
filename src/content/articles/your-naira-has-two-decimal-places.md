---
title: Storing Naira in Code Without Losing Kobo
summary: Floats can't count money, whole-naira integers quietly drop kobo, and JavaScript numbers have a limit. Here's how to store money so the totals always add up.
date: 2026-11-03
order: 2
tags: Money, Databases, JavaScript
---

Mama Bisi sells pepper at Mile 12. You buy ₦350 worth, hand her a ₦500 note, and she gives you ₦150 change without thinking about it. She has done this thousands of times and has never given anyone ₦149.99999999999997.

A lot of code has, though.

In this article, you will learn

- Why floating point numbers and money don't mix.
- Why storing whole naira is also wrong.
- Why storing kobo as an integer is the answer.
- Where JavaScript can still catch you out, and how to avoid it.
- How to split an amount without creating or losing a single kobo.

## THE CLASSIC EXAMPLE

Open your browser console and type this:

```js
0.1 + 0.2; // 0.30000000000000004
```

This isn't a JavaScript bug. It's how IEEE 754 floating point numbers work in almost every language. Floats store numbers in binary, and just like ⅓ can't be written exactly in decimal (0.3333…), 0.1 can't be written exactly in binary. The error is tiny, but with money tiny errors add up:

```js
let total = 0;
for (let i = 0; i < 1_000_000; i++) total += 0.1; // a million ₦0.10 transactions
total; // 100000.00000133288
```

Now your reconciliation report doesn't match the bank statement, and someone in finance is going to spend an afternoon looking for ₦0.0000013.

## "OKAY, I'LL USE WHOLE NAIRA"

The next idea is usually to store whole naira as an integer. No decimals, no problem.

The trouble is that the naira does have decimals. One naira is a hundred kobo, and fees, interest, 7.5% VAT and pro-rated subscriptions all produce kobo whether you want them or not. If your column is `amount_naira INTEGER`, a ₦0.50 fee has nowhere to go, so it gets rounded away and nobody notices.

> STORE MONEY AS AN INTEGER COUNT OF THE SMALLEST UNIT. FOR NAIRA, THAT'S KOBO.

So ₦2,500.50 is stored as `250050`. Adding, subtracting and comparing are now exact, because integer maths is exact. I put this rule at the top of the schema for a game I'm building, where every city has a bank balance and players trade all the time, because it's the kind of thing that's very easy to forget later.

## USE A BIG ENOUGH INTEGER

A normal 32-bit `INTEGER` maxes out at 2,147,483,647. In kobo that's about ₦21.4 million, which sounds like plenty until you process one large corporate payout or add up a month of transactions in a report.

Use a 64-bit integer instead:

```sql
CREATE TABLE ledger_entries (
  id          BIGSERIAL PRIMARY KEY,
  account_id  BIGINT NOT NULL REFERENCES accounts(id),
  amount_kobo BIGINT NOT NULL,              -- signed: credits positive, debits negative
  currency    CHAR(3) NOT NULL DEFAULT 'NGN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT amount_not_zero CHECK (amount_kobo <> 0)
);
```

A `BIGINT` holds about 9.2 quintillion kobo, so you won't run out.

If you'd rather use `NUMERIC(19,2)` and store naira with two decimal places, that's fine too. It's exact, and the database handles the decimal maths for you. Either way, the rule is the same: **no floats, and no type that can't hold kobo.**

## WHERE JAVASCRIPT CAN STILL CATCH YOU

The database is exact now. Then you read the value into Node.js.

A JavaScript `number` is a float. It can only represent every integer exactly up to `Number.MAX_SAFE_INTEGER`, which is 9,007,199,254,740,991. In kobo that's about ₦90 trillion. That's enough for most balances, but it means a `BIGINT` column can hold numbers JavaScript can't represent exactly.

That's why most Postgres drivers return `BIGINT` values as **strings**:

```js
const { rows } = await pool.query("SELECT amount_kobo FROM ledger_entries WHERE id = $1", [id]);
typeof rows[0].amount_kobo; // "string", so you don't lose precision by accident
```

Don't just wrap everything in `Number()` and move on. Choose on purpose:

```js
// Option 1: your values stay well below 2^53, so convert, but check.
function toKobo(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error(`Unsafe money value: ${value}`);
  return n;
}

// Option 2: you need the full range, so use BigInt everywhere.
const balance = BigInt(rows[0].amount_kobo); // 250050n
const withFee = balance + 5000n;             // exact, any size
```

Also, never accept money as a float from outside your system. Check it as it comes in:

```js
// Accept "2500.50" from a form and store 250050.
function parseNaira(input) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(input).trim());
  if (!match) throw new ValidationError("Amount must look like 2500 or 2500.50");
  const [, naira, kobo = "0"] = match;
  return Number(naira) * 100 + Number(kobo.padEnd(2, "0"));
}
```

We never multiply a float by 100 here. `2500.5 * 100` happens to work, but `1.15 * 100` gives you `114.99999999999999`. Parsing the string means there's no float anywhere along the way.

## FORMAT IT AT THE END

Kobo integers are for storing and calculating. People want to see naira, so convert only when you display the value:

```js
const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });
ngn.format(250050 / 100); // "₦2,500.50"
```

The division is safe here because it's only for display. The result never goes back into a calculation or the database.

## SPLITTING AN AMOUNT

Three friends split a ₦100 bill. Each one owes ₦33.333…, but you can't charge a third of a kobo. If you round everyone down to ₦33.33, you collect ₦99.99 and a kobo goes missing. If you round up to ₦33.34, you collect ₦100.02, and now you've made up two kobo out of nowhere.

The fix is to hand out the remainder on purpose:

```js
function split(totalKobo, parts) {
  const base = Math.floor(totalKobo / parts);
  const remainder = totalKobo - base * parts;
  // The first `remainder` people pay one extra kobo, so the total is always exact.
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

split(10000, 3); // [3334, 3333, 3333] → exactly 10000
```

It's a small function, but it's the difference between totals that add up and totals that are almost right. In finance, almost right usually ends up as a support ticket.

## THE RULES IN ONE PLACE

1. **Never use floats for money**, whether in the database, in transit or in your code.
2. **Store the smallest unit as a 64-bit integer**, or use an exact decimal type.
3. **Parse strings when money comes in.** Don't multiply floats to get kobo.
4. **Know what your database driver returns** for big integers, and convert on purpose.
5. **Format only for display**, right at the end.
6. **Hand out remainders explicitly** when you divide.

Mama Bisi gets this right every day without thinking about it. With these six rules, your code can too.
