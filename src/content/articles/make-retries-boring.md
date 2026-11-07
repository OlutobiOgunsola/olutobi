---
title: Idempotency for Payments: How to Make Retries Safe
summary: When a payment request times out, you don't know if it went through. Idempotency is how your system handles the retry without charging anyone twice.
date: 2026-11-03
order: 1
tags: Payments, Idempotency, Backend
---

It's 9:47pm. You're standing by a kiosk in Ikeja, phone held up for better network, trying to buy ₦2,000 worth of data before a meeting tomorrow. You tap **Pay**. The spinner keeps spinning, and then the app shows you the message every Nigerian has seen at least once:

*"Request timed out. Please try again."*

So did it go through or not? Has your account been debited? If you tap **Pay** again, will you get ₦4,000 worth of data, or ₦2,000 of data plus a long conversation with customer care?

Keep this kiosk in mind. We will come back to it.

In this article, you will learn

- Why a timeout is the most confusing response a payment system can give.
- What idempotency means, and what it doesn't mean.
- Why "check if it exists, then insert" doesn't work.
- How to let the database enforce the rule for you.
- How to design retries so they can't cause damage.

## A TIMEOUT DOESN'T TELL YOU ANYTHING

If a request fails with a `400`, you know it didn't happen. If it comes back with a `200`, you know it did. A timeout tells you neither. The request might have failed on the way in, or it might have failed on the way out, after the money had already moved. The client has no way of knowing which.

Because the client can't know, it will retry. Your mobile app will retry, your partner's integration will retry, your queue will retry, and the customer with the stubborn thumb will definitely retry. Networks drop, providers time out and people tap twice. This happens every day, not once in a while.

We can't stop retries, so we have to make them harmless.

> AN OPERATION IS IDEMPOTENT WHEN DOING IT TWICE HAS EXACTLY THE SAME EFFECT AS DOING IT ONCE.

Pay attention to the word *effect*. Idempotency doesn't mean the second request gets rejected with an error. It means the second request gets **the same result** as the first one. If the first purchase succeeded, the retry should also come back as "succeeded", with the same transaction reference, and nobody gets charged again.

## THE VERSION MOST OF US WRITE FIRST

Let us look at how most people first try to solve this. I've seen this code (and written it) more than once:

```js
async function purchase({ partnerId, reference, amountKobo }) {
  // Has this partner already sent us this reference?
  const existing = await Order.findOne({ where: { partnerId, reference } });
  if (existing) return existing; // yes, return the original

  // No? Then create it and charge.
  const order = await Order.create({ partnerId, reference, amountKobo, status: "pending" });
  await chargeWallet(partnerId, amountKobo);
  return order;
}
```

It looks fine, and it passes the tests. Then two copies of the same request arrive 30 milliseconds apart, maybe because a load balancer retried or a queue delivered the same message twice, and this happens:

```text
Request A: findOne → nothing found
Request B: findOne → nothing found      (A hasn't inserted yet)
Request A: create  → order #1, charge
Request B: create  → order #2, charge   (double charge)
```

Both requests checked whether the order existed before either of them created it. This is called a *check-then-act* race. Writing the application code more carefully won't fix it, because the problem is the gap between the check and the insert.

## LET THE DATABASE ENFORCE IT

Instead of asking the database whether a row exists, give it a rule it has to follow. A unique index is exactly that. It doesn't matter how many requests arrive or how close together they are. Two rows with the same key **can't** both exist.

```sql
-- A purchase is identified by who sent it and the reference they gave it.
CREATE UNIQUE INDEX orders_partner_reference_uniq
  ON orders (partner_id, reference);
```

Now the code doesn't have to prevent duplicates. It only has to handle the collision when one happens:

```js
async function purchase({ partnerId, reference, amountKobo }) {
  return sequelize.transaction(async (t) => {
    const [order, created] = await Order.findOrCreate({
      where: { partnerId, reference },
      defaults: { amountKobo, status: "pending" },
      transaction: t,
    });

    // We've seen this one before, so return the original result.
    if (!created) {
      if (order.amountKobo !== amountKobo) {
        // Same reference with a different amount isn't a retry. Something upstream is wrong.
        throw new ConflictError("Reference already used for a different order");
      }
      return order;
    }

    await debitWallet(partnerId, amountKobo, { transaction: t });
    return order;
  });
}
```

A few things to notice:

1. **The caller chooses the key.** The partner (or your mobile app) creates the `reference` *before* the first attempt and sends the same one on every retry. If the server creates the key after the request arrives, every retry gets a new key and the whole thing falls apart.
2. **The debit is in the same transaction as the insert.** If the debit fails, the order row is rolled back too, and the next retry starts from scratch.
3. **A retry with different details is an error.** The same key with a different payload means someone upstream is reusing references, and you want to know about that straight away.

When two requests race, one of them inserts the row. The other hits the unique index, waits for the first transaction to finish and then reads the row it created. The customer is charged once.

## WHAT ABOUT QUEUES?

The same problem shows up again when you put a queue in the middle and fan thousands of jobs out to workers. Most queues deliver messages *at least once*, which means some messages arrive twice. Sometimes a worker crashes halfway through a job and another worker picks it up.

Trying to build a queue that delivers exactly once, across third-party providers, is a lot of work for very little reward. It's much easier to do this:

> ACCEPT THAT MESSAGES CAN ARRIVE MORE THAN ONCE. MAKE SURE THEY ONLY TAKE EFFECT ONCE.

Give every job its own identity and enforce it with the same kind of unique index. If a worker picks up a job that another worker already finished, it hits the existing row and moves on. The duplicate is caught right where the money moves, which is the place that matters.

## BACK TO THE KIOSK

Remember our friend in Ikeja watching the spinner?

In a well-built system, the app created a reference the moment they tapped **Pay**. When they tap again, the app sends the *same* reference. The server finds the original purchase, sees that it succeeded and returns it. The app shows "₦2,000 data purchased" with the original receipt. No customer care call, and no reversal that takes three to five working days.

The second tap simply returned the first result, which is exactly what we wanted.

## A SHORT CHECKLIST

Before you ship anything that moves money, ask yourself:

1. **What identifies this operation?** Write it down. It's usually *who* sent it plus *what they called it*.
2. **Does the database enforce that identity?** With a unique constraint, not a `findOne`.
3. **Is the side effect saved together with the record?** In the same transaction, or designed so the side effect is idempotent too.
4. **What does a retry return?** The original result, not an error.
5. **What happens when a retry doesn't match?** It should fail with a clear error.

If you get those five right, you'll get far fewer late-night calls about double charges. Your customers won't notice anything, and with payments, that's a good sign.
