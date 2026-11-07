import type { LabTab } from "./types";
import { go, node } from "./helpers";

export const web: LabTab = {
  slug: "web",
  name: "Web & Networks",
  title: "The wire,",
  accent: "slowed down.",
  intro: "What actually happens between tapping a link and seeing a page, at a speed you can follow.",
  groups: [
    {
      title: "Getting there",
      entries: [
        {
          id: "dns",
          name: "DNS resolution",
          story: "You ask the gateman for “Mama Put's”. He doesn't know, but he knows who in the estate does.",
          rule: "Names resolve through a chain of servers, and every answer is cached for its TTL so the chain is only walked once.",
          demo: {
            kind: "flow",
            scene: {
              title: "where is shop.example.ng?",
              toggle: "Resolver cache",
              verdict: { on: "1ms the second time", off: "120ms every time" },
              nodes: [node("u", "Browser", "browser", 8, 50), node("r", "Resolver", "dns", 40, 50), node("root", "Root", "cdn", 80, 8), node("tld", ".ng servers", "dns", 88, 50), node("auth", "example.ng NS", "server", 80, 92)],
              edges: [["u", "r"], ["r", "root"], ["r", "tld"], ["r", "auth"]],
              on: [
                { note: "The browser asks its resolver (your ISP's, or 1.1.1.1).", packets: [go("u", "r", "shop.example.ng?")] },
                { note: "The resolver asks a root server, which points it at the .ng servers.", packets: [go("r", "root", "?"), go("root", "r", "try .ng")] },
                { note: ".ng points it at example.ng's own name servers, which give the answer.", packets: [go("r", "tld", "?"), go("r", "auth", "?"), go("auth", "r", "102.89.4.7", "ok")] },
                { note: "The resolver caches it for the record's TTL, say 300 seconds, and answers.", tone: "ok", packets: [go("r", "u", "102.89.4.7", "ok")], badges: { r: "cached 300s", u: "120ms" } },
                { note: "The next visitor asks the same question and gets the cached answer in a millisecond.", tone: "ok", packets: [go("u", "r", "?"), go("r", "u", "cached", "ok")], badges: { u: "1ms" } },
              ],
              off: [
                { note: "The browser asks its resolver.", packets: [go("u", "r", "shop.example.ng?")] },
                { note: "Root, then .ng, then the domain's name servers…", tone: "warn", packets: [go("r", "root", "?"), go("r", "tld", "?"), go("r", "auth", "?")] },
                { note: "…and with nothing cached, the next visitor walks the whole chain again.", tone: "bad", packets: [go("u", "r", "?"), go("r", "root", "?"), go("r", "tld", "?")], badges: { u: "120ms again" } },
              ],
            },
          },
          learn: {
            what: "DNS maps names to records (A/AAAA for addresses, CNAME for aliases, MX for mail, TXT for verification). A recursive resolver walks root → TLD → authoritative servers and caches each answer for its TTL.",
            when: "Every connection starts here. You'll care about it on every domain move, CDN setup, email deliverability fix and ‘it works for me but not for them’ outage.",
            tradeoffs: "Long TTLs mean fast lookups but slow changes. Lower the TTL a day before a migration, then raise it again. Caches you don't control may ignore your TTL.",
          },
        },
        {
          id: "keep-alive",
          name: "TCP handshakes & keep-alive",
          story: "You don't redial your friend for every sentence. You stay on the line.",
          rule: "Opening a connection costs round trips. Reuse open connections for many requests instead of paying that cost each time.",
          demo: {
            kind: "flow",
            scene: {
              title: "three API calls · 160ms round trip",
              toggle: "Keep-alive",
              verdict: { on: "~800ms", off: "~1.4s" },
              nodes: [node("c", "App", "phone", 10, 50), node("s", "Server", "server", 88, 50)],
              edges: [["c", "s"]],
              on: [
                { note: "TCP handshake: SYN, SYN-ACK, ACK. One round trip.", packets: [go("c", "s", "SYN"), go("s", "c", "SYN-ACK")], badges: { c: "160ms" } },
                { note: "TLS handshake: one more round trip on TLS 1.3.", packets: [go("c", "s", "ClientHello"), go("s", "c", "Finished")], badges: { c: "320ms" } },
                { note: "Request 1, request 2, request 3, over the same connection.", tone: "ok", packets: [go("c", "s", "GET 1"), go("s", "c", "200"), go("c", "s", "GET 2")], badges: { c: "~800ms total" }, status: { s: "ok" } },
                { note: "Each extra request costs only its own round trip.", tone: "ok", packets: [go("s", "c", "200", "ok")] },
              ],
              off: [
                { note: "TCP + TLS handshake for request 1.", packets: [go("c", "s", "SYN"), go("s", "c", "SYN-ACK"), go("c", "s", "Hello")], badges: { c: "480ms" } },
                { note: "Close. Handshake all over again for request 2.", tone: "warn", packets: [go("c", "s", "SYN"), go("s", "c", "SYN-ACK"), go("c", "s", "Hello")], badges: { c: "960ms" } },
                { note: "And again for request 3. Most of the time was spent saying hello.", tone: "bad", packets: [go("c", "s", "SYN"), go("s", "c", "SYN-ACK")], badges: { c: "~1.4s total" }, status: { c: "bad" } },
              ],
            },
          },
          learn: {
            what: "A TCP connection needs a three-way handshake, and TLS adds one or two more round trips. HTTP/1.1 keep-alive, HTTP/2 multiplexing and HTTP/3 (QUIC) all exist to pay that cost once and then reuse the connection.",
            when: "Mobile networks and long distances, where each round trip is expensive. Server-side too: reuse an HTTP agent or client when calling other APIs, rather than creating one per request.",
            tradeoffs: "Idle connections hold memory on both ends, and load balancers may close them; set sensible idle timeouts on both sides so they agree.",
          },
        },
        {
          id: "http-caching",
          name: "HTTP caching with ETags",
          story: "“Has the menu changed since this morning?” “No.”, and nobody reprints it.",
          rule: "Give responses a validator (ETag or Last-Modified). Clients ask ‘changed?’ and get an empty 304 when it hasn't.",
          demo: {
            kind: "flow",
            scene: {
              title: "GET /catalogue.json (2 MB)",
              toggle: "ETag",
              verdict: { on: "304 · 0 bytes", off: "2 MB again" },
              nodes: [node("b", "Browser", "browser", 10, 50), node("s", "Server", "server", 88, 50)],
              edges: [["b", "s"]],
              on: [
                { note: "First visit: full response with ETag: \"v42\".", packets: [go("b", "s", "GET"), go("s", "b", "200 · 2MB", "info")], badges: { b: "cached v42" } },
                { note: "Next visit: “If-None-Match: v42”.", packets: [go("b", "s", "If-None-Match v42")] },
                { note: "Nothing changed. 304 Not Modified, empty body. The browser uses its copy.", tone: "ok", packets: [go("s", "b", "304 · 0B", "ok")], status: { b: "ok" } },
              ],
              off: [
                { note: "First visit: full response, no validator.", packets: [go("b", "s", "GET"), go("s", "b", "200 · 2MB")] },
                { note: "Next visit: the browser can't tell whether its copy is current, so it asks for everything.", tone: "warn", packets: [go("b", "s", "GET")] },
                { note: "Another 2 MB on a mobile data plan, for identical bytes.", tone: "bad", packets: [go("s", "b", "200 · 2MB", "bad")], status: { b: "bad" } },
              ],
            },
          },
          learn: {
            what: "Cache-Control says how long a response may be reused without asking (max-age) and by whom (private, public). ETag and Last-Modified let the client revalidate cheaply once it's stale.",
            when: "Any GET whose response doesn't change on every request: catalogues, config, profile pictures, API lists. Static assets with hashed names get a long max-age and immutable.",
            tradeoffs: "Getting it wrong caches personal data publicly or keeps stale data too long. Revalidation still costs a round trip; max-age avoids even that, but you give up control until it expires.",
          },
        },
        {
          id: "websockets",
          name: "WebSockets vs polling",
          story: "You can ask “is the food ready?” every two minutes, or the waiter can just tell you.",
          rule: "When the server has news at unpredictable times, keep one connection open and push, instead of asking over and over.",
          demo: {
            kind: "flow",
            scene: {
              title: "live match score",
              toggle: "WebSocket",
              verdict: { on: "instant", off: "4 empty polls" },
              nodes: [node("p", "Phone", "phone", 10, 50), node("s", "Server", "server", 85, 50)],
              edges: [["p", "s"]],
              on: [
                { note: "The phone opens one WebSocket and keeps it open.", packets: [go("p", "s", "Upgrade")], status: { s: "ok" }, badges: { p: "connected" } },
                { note: "Twenty minutes of nothing. No traffic at all, apart from tiny pings.", tone: "info" },
                { note: "GOAL. The server pushes it the moment it happens.", tone: "ok", packets: [go("s", "p", "1–0 · 54'", "ok")], status: { p: "ok" }, badges: { p: "+0s" } },
              ],
              off: [
                { note: "The phone asks every 15 seconds: anything new?", packets: [go("p", "s", "GET /score"), go("s", "p", "same")] },
                { note: "Nothing. Nothing. Nothing. Each poll is a full HTTP request.", tone: "warn", packets: [go("p", "s", "GET"), go("s", "p", "same"), go("p", "s", "GET")], badges: { s: "40k polls/min" } },
                { note: "The goal happens just after a poll. The fan finds out up to 15 seconds late.", tone: "bad", packets: [go("s", "p", "1–0 · late", "bad")], badges: { p: "+14s" } },
              ],
            },
          },
          learn: {
            what: "A WebSocket upgrades an HTTP connection into a long-lived two-way channel. Server-Sent Events are a simpler one-way alternative. Polling is just asking repeatedly; long polling holds each request open until there's news.",
            when: "Chat, live scores, multiplayer games, collaborative editing, dashboards: anything where latency matters and updates are frequent or unpredictable.",
            tradeoffs: "Stateful connections are harder to load-balance and scale, and every client must reconnect and resync after a drop. For updates every few minutes, polling is simpler and perfectly fine.",
          },
          essay: { href: "/writing/a-goroutine-per-connection", label: "A Goroutine per Connection" },
        },
        {
          id: "debounce-throttle",
          name: "Debounce vs throttle",
          story: "Don't answer every “are we there yet?”. Answer when they've stopped asking, or at most once a minute.",
          rule: "Debounce waits for a pause before acting; throttle acts at most once per interval. Both turn a flood of events into a few calls.",
          demo: { kind: "custom", key: "debounce" },
          learn: {
            what: "Debounce delays a call until events stop for N ms (search-as-you-type, autosave). Throttle allows at most one call per N ms, usually with a trailing call at the end (scroll handlers, resize, rate-capped analytics).",
            when: "Any high-frequency browser event that triggers network calls or expensive work: keystrokes, scroll, resize, pointer moves.",
            tradeoffs: "Debounce adds latency to the final action; throttle can drop intermediate states. Neither replaces server-side rate limiting. They only make honest clients polite.",
          },
        },
      ],
    },
  ],
};
