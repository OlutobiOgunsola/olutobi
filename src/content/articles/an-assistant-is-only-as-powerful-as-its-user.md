---
title: An AI Assistant Should Never Be More Powerful Than the Person Using It
summary: The fastest way to build an assistant is to point a model at your database. It's also the fastest way to leak data across tenants. Here's the permission model I use instead.
date: 2026-11-03
order: 5
tags: AI engineering, Security, Architecture
---

Every estate in Lagos has a gateman. Let us call ours Baba Sule. Baba Sule is wonderful. He knows every resident by name, he knows whose car is whose, and he will happily tell you whether Mr Okafor in Flat 4 is home.

Now imagine Baba Sule also has a master key to every flat. And imagine anyone who smiles at him nicely enough can ask him to open any door.

That is what most AI assistants look like on the inside.

In this article, you will learn

- Why giving an assistant direct database access is a security bug, not a shortcut.
- The "API-only" rule, and what it buys you for free.
- How to filter tools by the user's role *before* the model sees them.
- Why authorization has to be checked again at execution time.
- How to route requests to cheaper models without losing quality.

## THE SHORTCUT

When I started building Vigil, the assistant that sits across the gym and hotel products I am building under Zigna, the quickest path was obvious. Give the model a read-only connection to the database, describe the schema, and let it write SQL. Gym owners could ask "how many members churned last month and why?" and get an answer in seconds.

Here is what goes wrong:

1. **Tenancy disappears.** Our products are multi-tenant: every gym's data sits in the same tables, separated by a `gym_id`. One prompt injection, or one sloppy generated query without a `WHERE gym_id = …`, and Gym A is reading Gym B's members.
2. **Roles disappear.** A front-desk staff member is not allowed to see payroll. The database does not know who is asking. The assistant does not care.
3. **Business rules disappear.** The product API knows that a refund needs a reason, that a suspended member cannot book a class, that phone numbers are only visible if the member consented. A raw SQL connection knows none of that.

You end up rebuilding every rule the product already enforces, inside a prompt, and hoping the model follows it.

> THE ASSISTANT MUST NEVER BE MORE POWERFUL THAN THE PERSON ASKING.

## RULE ONE: API-ONLY

So Vigil has one cardinal rule: **it knows nothing about product internals.** It never imports product code, never touches a product database, never reads a product's tables. It talks to every product exclusively through that product's published API: the same API the dashboard and the mobile app use.

Each capability is a *tool* that wraps one API call:

```js
// tools/zignalyft/members.list.js
module.exports = {
  name: "members_list",
  description: "List gym members, optionally filtered by status.",
  requiredPermissions: ["members:view_all", "members:view_assigned"],
  parameters: {
    type: "object",
    properties: { status: { type: "string", enum: ["active", "inactive", "suspended"] } },
  },
  async execute({ status }, ctx) {
    // Call the product API AS THE USER: their token, their active gym.
    return ctx.productApi("zignalyft").get("/members", {
      params: { status },
      headers: { Authorization: `Bearer ${ctx.userToken}`, "x-gym-id": ctx.activeGymId },
    });
  },
};
```

Look at the headers. The tool calls the API with **the user's own credentials**, not with some all-powerful service account. That one decision means the product's existing middleware does all the hard work: it resolves the tenant, checks the role, applies consent rules, validates input. Vigil inherits every protection the product already has, for free.

If a product does not expose an endpoint for something, Vigil simply cannot do it. That sounds like a limitation. It is actually the feature.

## RULE TWO: THE MODEL ONLY SEES WHAT THE USER MAY DO

API-only stops the assistant from *doing* something forbidden. But I also do not want the model to even *propose* it. If a receptionist asks "what did we spend on salaries this month?", I do not want the model to try the payroll tool, get a 403, and then explain to the receptionist that payroll exists but they cannot see it.

So before the model is prompted, the tool list is filtered by the caller's role:

```js
function getAccessibleTools(role, registry) {
  if (role === "super_admin") return Object.values(registry);
  const granted = new Set(ROLE_PERMISSIONS[role] ?? []);
  return Object.values(registry).filter((tool) =>
    tool.requiredPermissions.some((p) => granted.has(p)),
  );
}

const tools = getAccessibleTools(ctx.activeRole, registry);
const reply = await model.chat({ messages, tools }); // payroll tools aren't in this world
```

For the receptionist, the payroll tool does not exist. It is not in the prompt. The model cannot call what it cannot see, and it cannot be tricked into calling it, because there is nothing to trick it towards.

## RULE THREE: CHECK AGAIN ANYWAY

Filtering the tool list is about *experience*. It is not *security*. Models can produce tool calls with names that were never offered, and prompts can be manipulated. So at execution time, every tool call is checked again before anything runs:

```js
async function runToolCall(call, ctx) {
  const tool = registry[call.name];
  if (!tool || !hasAnyPermission(ctx.activeRole, tool.requiredPermissions)) {
    return { error: "This action isn't available to you." };
  }
  const args = validateArgs(tool.parameters, call.arguments); // schema-check what the model sent
  return tool.execute(args, ctx);
}
```

That gives us three layers, each of which would be enough on its own on a good day:

1. The model never sees tools the user cannot use.
2. Vigil refuses tool calls the user is not permitted to make.
3. The product API, called with the user's token, refuses anything the user cannot do.

Baba Sule no longer has a master key. He can only open the doors your own key opens, and he checks your key at every door.

## A BONUS: ROUTE BY DIFFICULTY

Once tools are cleanly separated from the model, it becomes easy to choose *which* model answers. Not every message deserves your most expensive one. "Hi" does not need deep reasoning. "Compare churn between our two branches and tell me why the Ibadan one is worse" probably does.

So every message is classified before it is answered:

```js
function classify(message) {
  if (HIGH_SIGNALS.some((re) => re.test(message))) return "high";   // analyse, compare, why, forecast
  if (MEDIUM_SIGNALS.some((re) => re.test(message))) return "medium"; // list, show, how many
  return "low";                                                      // greetings, yes/no
}
```

Each tier maps to a model, and if a tier fails, the request escalates to the next tier up instead of failing. Cost follows difficulty, and the user never sees the routing.

The classifier is deliberately simple: patterns, not another model. It is fast, free, and easy to reason about. I can always make it smarter later. I cannot easily make a slow, expensive classifier cheaper.

## THE TAKEAWAY

1. **Assistants call APIs, not databases.** Your API already encodes your rules. Reuse them.
2. **Call those APIs as the user.** Never as an all-powerful service account.
3. **Filter tools by role before prompting** so the model cannot even propose the forbidden.
4. **Re-check at execution time**, because filtering is UX and checking is security.
5. **Separate the model from the tools**, and you can swap, tier and route models freely.

A good gateman is helpful *because* he follows the rules of the estate, not in spite of them. Build your assistant the same way.
