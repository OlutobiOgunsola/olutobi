---
title: Every Query Has a Landlord: Multi-Tenancy Without Leaks
summary: In a multi-tenant SaaS, one missing WHERE clause shows one customer another customer's data. Here's how I resolve the tenant once and make forgetting it hard.
date: 2026-11-03
order: 4
tags: SaaS, Security, Backend
---

If you have ever lived in a face-me-I-face-you compound, you know the arrangement. Ten families, one building, one landlord. Everybody shares the corridor, the tap and the generator. But your room is *your* room. Your key opens your door and nobody else's.

Now imagine the landlord fits the locks himself, by hand, one at a time, and every so often, he forgets one.

That is how most multi-tenant applications are built.

In this article, you will learn

- What multi-tenancy means and why it fails quietly.
- The most common tenant leak (it is not SQL injection).
- How to resolve the tenant exactly once per request.
- How to make scoped queries the default instead of a habit.
- Small details, like 404 versus 403, that matter more than they look.

## ONE BUILDING, MANY FAMILIES

ZignaLyft, the gym management platform I am building, is multi-tenant. Every gym's members, payments and classes live in the same tables, separated by a `gym_id` column. This is efficient and simple to operate: one database, one deployment, one migration.

It also means the separation between Gym A and Gym B is **only as strong as the discipline of every single query.**

## THE LEAK NOBODY NOTICES

The most common tenant leak is not exotic. It looks like this:

```js
// GET /members/:id
async function getMember(req, res) {
  const member = await Member.findByPk(req.params.id); // 🚨
  if (!member) return res.notFound();
  return res.ok(member);
}
```

There is nothing wrong with this code in a single-tenant app. In a multi-tenant app, it lets any logged-in owner of *any* gym read *any* member of *any other gym*, just by changing the number in the URL. This class of bug has a name (insecure direct object reference, or IDOR), and it sits near the top of every security checklist for a reason.

It is never caught in testing, because in testing you only have one gym. It is never noticed in production, because nobody complains about seeing too much. It just leaks.

> IN A MULTI-TENANT SYSTEM, AN UNSCOPED QUERY IS A SECURITY BUG, EVEN WHEN IT WORKS.

## RESOLVE THE TENANT ONCE

The first fix is structural. The tenant is not something each controller figures out for itself. It is resolved **once**, in middleware, before any business logic runs.

In ZignaLyft, a person can be an owner at one gym and a member at another. So the client sends the gym it is acting in, and the middleware proves the person actually belongs there:

```js
// middleware/gymContext.middleware.js
async function gymContext(req, res, next) {
  const gymId = Number(req.header("x-gym-id"));
  if (!gymId) return res.badRequest("Select a gym first.");

  const membership = await GymMembership.findOne({
    where: { user_id: req.userId, gym_id: gymId, status: "active" },
    attributes: ["id", "role"],
  });
  if (!membership && !req.isSuperAdmin) return res.notFound("Gym not found.");

  req.activeGymId = gymId;
  req.activeRole = membership?.role ?? "super_admin";
  req.activeMembershipId = membership?.id ?? null;
  next();
}
```

The header is just a *claim*. The membership lookup is the *proof*. From this point onward, `req.activeGymId` is trusted, and nothing else is, not a `gym_id` in the body, not one in the query string.

## MAKE SCOPING THE DEFAULT

Resolving the tenant is half the battle. The other half is making sure every query uses it. "Just remember to add `WHERE gym_id`" is not a strategy. People forget. I forget.

So services never receive raw IDs alone. They receive a *context* that carries the tenant, and every lookup goes through it:

```js
// services/member.service.js
module.exports = {
  async getMember({ activeGymId }, memberId) {
    const member = await Member.findOne({ where: { id: memberId, gym_id: activeGymId } });
    if (!member) throw new NotFoundError("Member not found.");
    return member;
  },
};

// controller
const member = await memberService.getMember(req, req.params.id);
```

There is no `getMember(id)` function to call by accident. The only way to fetch a member is with a tenant. When you make the safe path the *only* path, you stop relying on memory.

A few more habits that help:

1. **Composite uniqueness.** Things like invite codes and member numbers should be unique per gym (`UNIQUE (gym_id, member_number)`) not globally, so tenants never collide and never learn about each other.
2. **Scope your joins too.** When you load a member's payments, scope the payments query by `gym_id` as well. Defence in depth costs one extra condition.
3. **Explicit columns.** Select only what you return. A model that accidentally includes `password_hash` or a reset token is a different leak, but it is a leak all the same.

## 404, NOT 403

Look at what happens when someone requests a member from another gym. We return **404 Not Found**, not **403 Forbidden**.

That is deliberate. A 403 says "this exists, but you can't have it." That alone is information: it confirms member 1042 exists, which lets an attacker enumerate IDs across tenants. A 404 says nothing at all. From inside Gym A, Gym B's data does not exist.

## PERMISSIONS LIVE INSIDE THE TENANT

Tenancy answers "which building?" Permissions answer "what can you do in this room?" Both are needed, and they stack.

ZignaLyft uses fine-grained permissions rather than broad roles. An instructor has `members:view_assigned`, not `members:view_all`, so they only see the members assigned to them. And some data has a consent gate on top: an instructor only sees a member's phone number if that member opted in to sharing it. That check happens at query time, not by hiding a field in the UI.

```js
const attributes = ["id", "first_name", "last_name", "status"];
if (can(req, "members:view_contact_all") ||
    (can(req, "members:view_contact_assigned") && member.share_phone)) {
  attributes.push("phone");
}
```

## TEST WITH TWO GYMS, ALWAYS

Finally: the bug lives in the gap between tenants, so your tests need two tenants. My rule of thumb is that every endpoint deserves at least one test that goes like this:

1. Create Gym A and Gym B, each with an owner and a member.
2. Log in as Gym A's owner.
3. Request Gym B's member by ID.
4. Expect a 404.

It is four lines, and it is the most valuable test in the whole suite.

The landlord does not need to be a genius. He just needs to fit every lock the same way, every time, and check that your key does not open your neighbour's door.
