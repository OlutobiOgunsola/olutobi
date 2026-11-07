import type { LabTab } from "./types";
import { go, node } from "./helpers";

export const security: LabTab = {
  slug: "security",
  name: "Security",
  title: "Security that",
  accent: "assumes the worst.",
  intro: "Every attack here is old, well documented and still works on someone's app today. Play the attacker, then flip the defence on.",
  groups: [
    {
      title: "Secrets at rest",
      entries: [
        {
          id: "password-hashing",
          name: "Slow password hashing",
          story: "A lock that takes a quarter-second to try is nothing to you, and a lifetime to a thief with a billion keys.",
          rule: "Hash passwords with an algorithm built to be slow (bcrypt, scrypt, Argon2 or PBKDF2 with many iterations) never a fast hash.",
          demo: { kind: "custom", key: "password-hash" },
          learn: {
            what: "General-purpose hashes like SHA-256 are designed to be fast, which is exactly wrong for passwords: an attacker with a leaked table can try billions of guesses a second on GPUs. Password hashes are deliberately slow and often memory-hard, with a tunable cost.",
            when: "Every stored password or PIN. Tune the cost so one hash takes around 100–500ms on your servers, and raise it as hardware gets faster.",
            tradeoffs: "Login costs CPU, so rate-limit the login endpoint, or it becomes an easy way to overload you. Use a well-reviewed library; never write your own scheme.",
          },
        },
        {
          id: "salting",
          name: "Salting",
          story: "Two people with the same padlock key shouldn't mean one stolen key opens both gates.",
          rule: "Add a unique random salt to every password before hashing, so identical passwords produce different hashes and precomputed tables are useless.",
          demo: { kind: "custom", key: "salt" },
          learn: {
            what: "A salt is a random value stored next to each hash and mixed into it. It defeats rainbow tables (precomputed hash → password lists) and hides which users share a password.",
            when: "Always, alongside a slow hash. bcrypt, scrypt and Argon2 generate and store the salt for you inside the hash string.",
            tradeoffs: "None worth arguing about. A salt is not a secret, and it doesn't slow down a targeted attack on one account. The slow hash does that. A pepper (an app-wide secret) is an optional extra layer.",
          },
        },
        {
          id: "jwt-tampering",
          name: "Signed tokens",
          story: "Anyone can write “VIP” on a wristband. That's why the bouncer checks the hologram.",
          rule: "Treat a token's payload as untrusted until its signature verifies against your key, with the algorithm you expect, not the one the token claims.",
          demo: { kind: "custom", key: "jwt" },
          learn: {
            what: "A JWT is base64url-encoded JSON, not encryption: anyone can read and edit the payload. The signature (an HMAC or RSA/ECDSA signature over header.payload) is what proves the server issued it unchanged.",
            when: "Every time you accept a JWT: APIs, mobile sessions, service-to-service calls. Verify the signature, the expiry, the issuer and the audience.",
            tradeoffs: "JWTs can't easily be revoked before they expire, so keep them short-lived and pair them with refresh tokens. Pin the algorithm on verification to avoid ‘alg: none’ and key-confusion attacks. Don't put secrets in the payload.",
            inMyWork: "ZignaLyft's API issues JWTs to its mobile app, which is the setup where this check has to be right.",
          },
        },
      ],
    },
    {
      title: "Untrusted input",
      entries: [
        {
          id: "sql-injection",
          name: "SQL injection",
          story: "You asked for a name. They gave you a name and a new instruction for your database.",
          rule: "Never build SQL by concatenating input. Use parameterised queries, so data is always data and never code.",
          demo: {
            kind: "flow",
            scene: {
              title: "login: email = ' OR '1'='1",
              toggle: "Parameterised query",
              verdict: { on: "no match", off: "logged in as admin" },
              nodes: [node("at", "Attacker", "attacker", 8, 50), node("api", "Login API", "server", 42, 50), node("db", "users", "db", 85, 50)],
              edges: [["at", "api"], ["api", "db"]],
              on: [
                { note: "The attacker types  ' OR '1'='1  into the email field.", packets: [go("at", "api", "' OR '1'='1", "bad")] },
                { note: "The query is sent with a placeholder: WHERE email = $1. The input travels separately.", packets: [go("api", "db", "$1 = \"' OR…\"")], status: { db: "busy" } },
                { note: "The database looks for a user whose email is literally that string. There isn't one.", tone: "ok", packets: [go("db", "api", "0 rows", "ok")], status: { db: "ok" } },
                { note: "401. The quote marks were just characters.", tone: "ok", packets: [go("api", "at", "401", "ok")] },
              ],
              off: [
                { note: "The attacker types  ' OR '1'='1  into the email field.", packets: [go("at", "api", "' OR '1'='1", "bad")] },
                { note: "The API glues it into the SQL: WHERE email = '' OR '1'='1'.", tone: "warn", packets: [go("api", "db", "…OR '1'='1'", "bad")], status: { db: "busy" } },
                { note: "That's true for every row. The first user returned is the admin.", tone: "bad", packets: [go("db", "api", "admin", "bad")], status: { db: "bad" } },
                { note: "Logged in as admin, no password needed.", tone: "bad", packets: [go("api", "at", "200 · admin", "bad")], status: { at: "bad" } },
              ],
            },
          },
          learn: {
            what: "When user input is concatenated into a query string, crafted input can change the query's structure: bypass logins, dump tables, drop them. Parameterised queries send the SQL and the values separately, so values can never become syntax.",
            when: "Every query. ORMs parameterise by default, but raw-query escape hatches, dynamic ORDER BY clauses and string-built filters are where it slips back in.",
            tradeoffs: "None. Identifiers (table and column names) can't be parameters, so allow-list them. Escaping by hand is not a substitute.",
          },
        },
        {
          id: "xss",
          name: "Cross-site scripting",
          story: "A comment that isn't a comment. It's a tiny program, and every visitor runs it.",
          rule: "Escape user content when you render it, so the browser shows it as text instead of running it as code, and add a CSP as a seatbelt.",
          demo: {
            kind: "flow",
            scene: {
              title: "comment: <script>steal(document.cookie)</script>",
              toggle: "Escape output",
              verdict: { on: "just text", off: "session stolen" },
              nodes: [node("at", "Attacker", "attacker", 8, 18), node("site", "Site", "server", 45, 50), node("v", "Visitor", "browser", 8, 82), node("ev", "evil.example", "cloud", 88, 50)],
              edges: [["at", "site"], ["site", "v"], ["v", "ev"]],
              on: [
                { note: "The attacker posts a comment containing a script tag.", packets: [go("at", "site", "<script>", "bad")], badges: { site: "stored" } },
                { note: "A visitor opens the page. The site renders the comment escaped: &lt;script&gt;.", packets: [go("site", "v", "&lt;script&gt;", "ok")] },
                { note: "The visitor sees some odd text. Nothing runs.", tone: "ok", status: { v: "ok" } },
              ],
              off: [
                { note: "The attacker posts a comment containing a script tag.", packets: [go("at", "site", "<script>", "bad")], badges: { site: "stored" } },
                { note: "A visitor opens the page. The HTML goes out as is.", tone: "warn", packets: [go("site", "v", "<script>", "bad")] },
                { note: "Their browser runs it, with the site's permissions.", tone: "bad", status: { v: "bad" } },
                { note: "Their session cookie is posted to the attacker's server.", tone: "bad", packets: [go("v", "ev", "cookie", "bad")], status: { ev: "bad" } },
              ],
            },
          },
          learn: {
            what: "XSS happens when untrusted data is placed into a page in a way the browser interprets as markup or script. The script then runs as your site: it can read the page, make requests and steal tokens.",
            when: "Anywhere you render user-controlled data: comments, names, search terms reflected in the page, URLs in href attributes, and anything set via innerHTML or dangerouslySetInnerHTML.",
            tradeoffs: "React escapes by default. The risk is in the escape hatches. Sanitise HTML you must render (rich text) with a vetted library. A Content-Security-Policy limits the damage, and HttpOnly cookies keep sessions out of reach of scripts.",
          },
        },
        {
          id: "csrf",
          name: "Cross-site request forgery",
          story: "You're logged in to your bank. A cat video on another site quietly submits a transfer form, with your cookies attached.",
          rule: "Don't let a request ride on cookies alone. Use SameSite cookies and a per-session token the other site can't know.",
          demo: {
            kind: "flow",
            scene: {
              title: "POST /transfer from evil.example",
              toggle: "SameSite + CSRF token",
              verdict: { on: "blocked", off: "₦50,000 sent" },
              nodes: [node("v", "Your browser", "browser", 10, 50), node("ev", "cat-videos.example", "attacker", 45, 12), node("bank", "Bank", "bank", 85, 50)],
              edges: [["v", "ev"], ["v", "bank"]],
              on: [
                { note: "You're logged in to the bank in another tab.", badges: { v: "bank session" } },
                { note: "You visit a page with a hidden auto-submitting form aimed at the bank.", packets: [go("ev", "v", "hidden form", "bad")] },
                { note: "The browser withholds the SameSite cookie on a cross-site POST, and the form has no CSRF token.", packets: [go("v", "bank", "POST /transfer")], tone: "warn" },
                { note: "403. The bank never saw a logged-in request.", tone: "ok", packets: [go("bank", "v", "403", "ok")], status: { bank: "ok" } },
              ],
              off: [
                { note: "You're logged in to the bank in another tab.", badges: { v: "bank session" } },
                { note: "You visit a page with a hidden auto-submitting form aimed at the bank.", packets: [go("ev", "v", "hidden form", "bad")] },
                { note: "The browser sends your bank cookie along with the POST, as it always used to.", tone: "warn", packets: [go("v", "bank", "POST + cookie", "bad")] },
                { note: "The bank sees a valid session and moves the money.", tone: "bad", status: { bank: "bad" }, badges: { bank: "−₦50,000" } },
              ],
            },
          },
          learn: {
            what: "CSRF tricks a logged-in browser into sending a state-changing request to another site, relying on the browser to attach cookies automatically. The attacker can't read the response. They don't need to.",
            when: "Any cookie-authenticated endpoint that changes state. APIs using Authorization headers (not cookies) are not exposed in the same way.",
            tradeoffs: "SameSite=Lax is now the browser default and stops most cases; still use CSRF tokens on sensitive forms and never change state on GET. Subdomains you don't control count as ‘same site’.",
          },
        },
        {
          id: "cors",
          name: "CORS",
          story: "Your neighbour can knock on your door. That doesn't mean the browser lets them read your post.",
          rule: "Only allow specific, trusted origins to read your API's responses, and never reflect any origin back while allowing credentials.",
          demo: {
            kind: "flow",
            scene: {
              title: "fetch('https://api.bank/me', { credentials: 'include' })",
              toggle: "Strict allow-list",
              verdict: { on: "browser blocked it", off: "data leaked" },
              nodes: [node("ev", "evil.example", "attacker", 10, 20), node("br", "Victim's browser", "browser", 10, 80), node("api", "api.bank", "server", 85, 50)],
              edges: [["ev", "br"], ["br", "api"]],
              on: [
                { note: "Script on evil.example runs in the victim's browser and calls the bank's API.", packets: [go("ev", "br", "fetch /me", "bad"), go("br", "api", "Origin: evil")] },
                { note: "The API answers, but without Access-Control-Allow-Origin: evil.example.", packets: [go("api", "br", "no ACAO")], badges: { api: "allows app.bank only" } },
                { note: "The browser refuses to hand the response to the script.", tone: "ok", status: { br: "ok" }, packets: [go("br", "ev", "CORS error", "ok")] },
              ],
              off: [
                { note: "Script on evil.example runs in the victim's browser and calls the bank's API.", packets: [go("ev", "br", "fetch /me", "bad"), go("br", "api", "Origin: evil")] },
                { note: "The API reflects the Origin header back and says credentials are allowed.", tone: "warn", packets: [go("api", "br", "ACAO: evil", "bad")], badges: { api: "reflects any origin" } },
                { note: "The browser hands the victim's account details to the attacker's script.", tone: "bad", packets: [go("br", "ev", "balance, BVN", "bad")], status: { ev: "bad" } },
              ],
            },
          },
          learn: {
            what: "Cross-Origin Resource Sharing is a browser rule: by default, a script may send requests to other origins but may not read their responses. A server can relax this with Access-Control-Allow-* headers for origins it trusts.",
            when: "Configure it whenever a browser app on one origin calls an API on another. Keep an explicit allow-list.",
            tradeoffs: "CORS protects users' browsers, not your server. Curl ignores it, so it isn't authentication. Wildcards with credentials are blocked by browsers; reflecting the Origin header gets around that, which is exactly the bug.",
          },
        },
      ],
    },
    {
      title: "Proving who sent it",
      entries: [
        {
          id: "hmac-signatures",
          name: "HMAC request signing",
          story: "A cheque is only good with the signature the bank has on file, not one copied from a picture of it.",
          rule: "Have the sender sign the raw body with a shared secret, recompute the signature on arrival, and reject anything that doesn't match.",
          demo: {
            kind: "flow",
            scene: {
              title: "POST /webhooks/payments: charge.success",
              toggle: "Verify HMAC",
              verdict: { on: "forgery rejected", off: "free ₦500k" },
              nodes: [node("ps", "Provider", "bank", 10, 18), node("at", "Attacker", "attacker", 10, 82), node("api", "Our API", "server", 50, 50), node("w", "Wallets", "wallet", 88, 50)],
              edges: [["ps", "api"], ["at", "api"], ["api", "w"]],
              on: [
                { note: "A real webhook arrives with a signature header: HMAC-SHA512(secret, body).", packets: [go("ps", "api", "body + sig", "ok")] },
                { note: "We recompute it with our copy of the secret. Match. Credit the wallet.", tone: "ok", packets: [go("api", "w", "+₦10k", "ok")], status: { w: "ok" } },
                { note: "The attacker found our webhook URL and posts a fake ‘charge.success’ for ₦500,000.", tone: "warn", packets: [go("at", "api", "fake body", "bad")] },
                { note: "They don't have the secret, so their signature can't match. 401.", tone: "ok", packets: [go("api", "at", "401", "ok")], status: { api: "ok" } },
              ],
              off: [
                { note: "A real webhook arrives. We take it at its word.", packets: [go("ps", "api", "body"), go("api", "w", "+₦10k")] },
                { note: "The attacker finds the webhook URL and posts a fake ‘charge.success’ for ₦500,000.", tone: "warn", packets: [go("at", "api", "fake body", "bad")] },
                { note: "It looks exactly like the real thing. We credit the wallet.", tone: "bad", packets: [go("api", "w", "+₦500k", "bad")], status: { w: "bad" }, badges: { w: "+₦500,000" } },
              ],
            },
          },
          learn: {
            what: "A hash-based message authentication code combines a secret key and the message so only someone with the key could produce it. The receiver recomputes it over the exact raw bytes received and compares in constant time.",
            when: "Inbound webhooks (payment providers, Git hosts), signed URLs, and service-to-service calls where mTLS is too heavy.",
            tradeoffs: "Verify over the raw body, before any JSON parsing changes it. Add a timestamp to the signed data and reject old ones to stop replays. Rotating secrets needs a window where both old and new are accepted.",
            inMyWork: "Sentinel takes Paystack webhooks for estate levies, exactly the endpoint a forged ‘payment succeeded’ would target.",
          },
        },
        {
          id: "constant-time-compare",
          name: "Constant-time comparison",
          story: "If the safe clicks louder when the first digit is right, you don't need the combination. You need patience.",
          rule: "Compare secrets with a function that always takes the same time, so response timing can't leak how much of a guess was right.",
          demo: {
            kind: "flow",
            scene: {
              title: "X-API-Key: guessing one character at a time",
              toggle: "Constant-time compare",
              verdict: { on: "timing is flat", off: "key recovered" },
              nodes: [node("at", "Attacker", "attacker", 10, 50), node("api", "API", "server", 50, 50), node("key", "sk_9f…", "key", 88, 50)],
              edges: [["at", "api"], ["api", "key"]],
              on: [
                { note: "The attacker tries keys starting a…, b…, c…, thousands of times each, and times the answers.", packets: [go("at", "api", "a…"), go("at", "api", "b…"), go("at", "api", "9…")] },
                { note: "Every comparison checks every byte, whether the first one matched or not.", packets: [go("api", "key", "compare all")], badges: { api: "every guess: 1.20ms" } },
                { note: "The timings are identical. Nothing to learn.", tone: "ok", packets: [go("api", "at", "401", "ok")], status: { api: "ok" } },
              ],
              off: [
                { note: "The attacker tries keys starting a…, b…, c…, thousands of times each, and times the answers.", packets: [go("at", "api", "a…"), go("at", "api", "b…"), go("at", "api", "9…")] },
                { note: "== stops at the first wrong byte. A guess starting with 9 runs slightly longer.", tone: "warn", packets: [go("api", "key", "early exit")], badges: { api: "9…: +40ns" } },
                { note: "Averaged over enough tries, the difference stands out. Move on to the second character.", tone: "bad", badges: { at: "sk_9…" } },
                { note: "Character by character, the key comes out.", tone: "bad", status: { key: "bad" }, badges: { at: "sk_9f…" } },
              ],
            },
          },
          learn: {
            what: "Ordinary string equality returns as soon as it finds a difference, so the time taken depends on how many leading bytes matched. Constant-time comparison (crypto.timingSafeEqual, hmac.compare_digest, subtle.ConstantTimeCompare) always examines every byte.",
            when: "Comparing anything secret against attacker-supplied input: API keys, HMAC signatures, password-reset tokens, session IDs.",
            tradeoffs: "Basically free. Network jitter makes the attack slow, not impossible, attackers just average more samples. Hashing both values first also avoids leaking the length.",
          },
        },
        {
          id: "tls",
          name: "TLS",
          story: "Anyone in the café can read a postcard on its way past. Nobody can read a sealed letter.",
          rule: "Encrypt every connection and verify the server's certificate, so nobody on the network can read or change what's sent.",
          demo: {
            kind: "flow",
            scene: {
              title: "login over café Wi-Fi",
              toggle: "HTTPS",
              verdict: { on: "gibberish", off: "password captured" },
              nodes: [node("u", "Your phone", "phone", 8, 50), node("mitm", "Café Wi-Fi", "router", 45, 50), node("s", "app.example", "server", 88, 50)],
              edges: [["u", "mitm"], ["mitm", "s"]],
              on: [
                { note: "Handshake: the server presents a certificate signed by a trusted authority. The phone checks it.", packets: [go("u", "s", "ClientHello"), go("s", "u", "certificate", "ok")], status: { s: "ok" } },
                { note: "They agree on fresh keys that nobody watching can work out.", tone: "ok", badges: { u: "session keys", s: "session keys" } },
                { note: "The password travels encrypted. The router sees random bytes.", tone: "ok", packets: [go("u", "mitm", "x9#Lq…", "ok"), go("mitm", "s", "x9#Lq…", "ok")], badges: { mitm: "can't read" } },
              ],
              off: [
                { note: "Plain HTTP. The phone sends the login form as text.", packets: [go("u", "mitm", "password=ada123", "bad")] },
                { note: "Anyone on the same network can read it as it passes.", tone: "bad", status: { mitm: "bad" }, badges: { mitm: "password=ada123" } },
                { note: "Or change it: they inject a script into the page on its way back.", tone: "bad", packets: [go("mitm", "u", "page + script", "bad")], status: { u: "bad" } },
              ],
            },
          },
          learn: {
            what: "Transport Layer Security authenticates the server (via a certificate chain to a trusted root) and sets up encryption and integrity for the connection. HTTPS is HTTP over TLS.",
            when: "Every connection, including internal service-to-service traffic and database connections where you can. Add HSTS so browsers never try plain HTTP.",
            tradeoffs: "Certificates expire: automate renewal (Let's Encrypt, managed certs). Terminating TLS at a load balancer means traffic behind it is plain unless you re-encrypt. Mobile apps can pin certificates, at the cost of harder rotation.",
          },
        },
      ],
    },
  ],
};
