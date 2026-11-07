---
title: Don't Let the Model Pick Your IDs: Putting an LLM Behind a Validation Wall
summary: Language models are brilliant at understanding what people mean and terrible at being a source of truth. Here's how I let one power search without ever trusting it with a database ID.
date: 2026-11-03
order: 6
tags: AI engineering, LLMs, Search
---

You have just landed in Lagos and you need a tailor. You walk up to a bus conductor at the park and ask, "Abeg, where I fit see good tailor for Yaba?"

He understands you perfectly. He understands "good," he understands "tailor," he understands "Yaba," and he understands that you are new here. He will point confidently in a direction. Very helpful.

What you should *not* do is take the shop address he gives you and send money to it without checking whether that shop exists.

That is my whole relationship with large language models in production.

In this article, you will learn

- Why LLM output should be treated as user input, not as data.
- How to split "understanding" from "deciding."
- How to validate model output against a live taxonomy.
- Why every AI feature needs a non-AI fallback.
- A few rules I now follow for every feature that has a model in it.

## THE PROBLEM

On Ducent, a trust platform I am building for Nigerian commerce, people search the way they talk: *"tailor in Yaba"*, *"who dey sell original iPhone for Ikeja"*, *"cake for my daughter's birthday Lekki phase 1."*

A plain keyword search does badly with that. "who dey sell original" matches nothing useful, and "Lekki phase 1" is a place, not a product. This is exactly what LLMs are good at: turning messy human language into structure.

The tempting design is to give the model your database schema and let it write the query, or hand it your category list and ask it to return the matching category ID. It works in the demo. Then one day it returns `category_id: 4127`, and you do not have a category 4127, or worse, you *do*, and it is "Funeral Services."

> A LANGUAGE MODEL IS A GREAT INTERPRETER AND A TERRIBLE SOURCE OF TRUTH.

## SPLIT UNDERSTANDING FROM DECIDING

So the model gets one job only: tell me what this person *means*, in words. It never sees an ID and it never produces one.

```js
const SYSTEM_PROMPT = `Extract search intent from a Nigerian marketplace query.
Return JSON only: {"terms": string[], "location": {"city": string|null, "area": string|null}}.
"terms" are what the person wants to buy or hire, in plain English.
Do not invent places. If no location is mentioned, use null.`;
```

For *"who dey sell original iPhone for Ikeja"*, the model returns something like:

```json
{ "terms": ["iphone", "phone vendor"], "location": { "city": "Lagos", "area": "Ikeja" } }
```

That is the "understanding" half, and the model is very good at it. Now our code does the "deciding" half.

## TREAT THE OUTPUT AS HOSTILE INPUT

Everything the model returns goes through the same validation you would apply to a form submitted by a stranger on the internet, because, functionally, that is what it is:

```js
const Joi = require("joi");

const intentSchema = Joi.object({
  terms: Joi.array().items(Joi.string().trim().lowercase().max(40)).max(6).required(),
  location: Joi.object({
    city: Joi.string().allow(null).max(40),
    area: Joi.string().allow(null).max(60),
  }).required(),
}).unknown(false); // anything extra the model "helpfully" adds is rejected

function parseIntent(raw) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return null; // not JSON? not an intent.
  }
  const { error, value } = intentSchema.validate(json);
  return error ? null : value;
}
```

Then the validated words are matched against **our own taxonomy**, the real list of categories and real places in our database, and only *our code* turns them into IDs:

```js
function resolveIntent(intent, taxonomy) {
  const categoryIds = intent.terms
    .map((term) => taxonomy.categoriesByKeyword.get(term))
    .filter(Boolean);                      // unknown words simply drop out

  const city = taxonomy.citiesByName.get(intent.location.city?.toLowerCase());
  return { categoryIds: [...new Set(categoryIds)], cityId: city?.id ?? null };
}
```

If the model hallucinates a category, it does not match anything and quietly disappears. If it invents a city, the city lookup fails and we search without a city. The worst thing a confused model can do is make the search a bit *less* specific. It cannot make it *wrong*.

The taxonomy lives in memory and refreshes every few minutes, so new categories show up without a deploy, and every request does not cost a database round-trip.

## ALWAYS HAVE A PLAN B

Here is something that happened to me while building this. The AI provider key was valid, the code was correct, and every single inference call started failing. The account behind the key had run out of credit. In production, it could just as easily be an outage, a rate limit, or a slow response at peak time.

If search depended on the model, search would be down. It wasn't, because search never depended on the model.

```js
async function searchIntent(query) {
  try {
    const raw = await withTimeout(llm.complete(SYSTEM_PROMPT, query), 2500);
    const intent = parseIntent(raw);
    if (intent) return { ...intent, source: "ai" };
  } catch (err) {
    log.warn("search-intent provider failed, using fallback", { err: err.message });
  }
  return { ...deterministicExtract(query), source: "fallback" };
}
```

`deterministicExtract` is boring code: lowercase, strip filler words like "who dey sell" and "abeg," match known place names from the taxonomy, keep the remaining nouns as terms. It is nowhere near as clever as the model. It is also never down, never slow, and never costs anything.

> IF YOUR FEATURE STOPS WORKING WHEN THE MODEL STOPS WORKING, THE MODEL IS A SINGLE POINT OF FAILURE.

The `source` field is not decoration either. It goes into the logs, so I can see how often we are falling back, and compare result quality between the two paths.

## THE RULES I FOLLOW NOW

Every feature I build with a model in the loop follows these:

1. **The model interprets; code decides.** The model produces words, never IDs, prices, permissions or queries.
2. **Validate output like user input.** Strict schema, reject unknown fields, cap lengths.
3. **Resolve against your own source of truth.** Unknown values drop out; they never become new data.
4. **Time-box every call.** A slow model should degrade to the fallback, not hang the request.
5. **Ship the fallback first.** If the deterministic version is not good enough to launch on its own, the AI version is not ready either.
6. **Log which path answered.** You cannot improve what you cannot see.

The bus conductor is genuinely useful. He knows Lagos better than any map. You just check the address before you send the money.
