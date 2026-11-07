import type { LabTab } from "./types";
import { go, node } from "./helpers";

export const databases: LabTab = {
  slug: "databases",
  name: "Database Design",
  title: "Databases that",
  accent: "don't lie.",
  intro: "The database is the last line of defence and the first place performance dies. Fifteen decisions that decide whether yours tells the truth, quickly.",
  groups: [
    {
      title: "Finding rows fast",
      entries: [
        {
          id: "indexes",
          name: "Indexes",
          story: "Finding “Okafor” in the phone book is easy because it's sorted. Finding everyone on Allen Avenue is not.",
          rule: "Index the columns you filter and join on, so the database jumps to the rows instead of reading every one.",
          demo: {
            kind: "flow",
            scene: {
              title: "SELECT * FROM customers WHERE phone = '0803…'",
              toggle: "Index on phone",
              verdict: { on: "2ms", off: "1.8s" },
              nodes: [node("app", "App", "server", 8, 50), node("pl", "Planner", "search", 40, 50), node("ix", "phone index", "layers", 80, 15), node("tb", "customers · 1M rows", "disk", 80, 85)],
              edges: [["app", "pl"], ["pl", "ix"], ["pl", "tb"], ["ix", "tb"]],
              on: [
                { note: "The query arrives. The planner sees an index on phone.", packets: [go("app", "pl", "WHERE phone")], status: { pl: "busy" } },
                { note: "It walks the B-tree: root, branch, leaf. Three pages.", packets: [go("pl", "ix", "seek")], status: { ix: "ok" }, badges: { ix: "3 pages" } },
                { note: "The leaf points straight at one row.", tone: "ok", packets: [go("ix", "tb", "row 482,113")], badges: { tb: "1 row read" }, status: { tb: "ok" } },
                { note: "Two milliseconds, whether the table has a thousand rows or a hundred million.", tone: "ok", packets: [go("pl", "app", "2ms", "ok")], status: { pl: "ok" } },
              ],
              off: [
                { note: "The query arrives. There's no index on phone.", packets: [go("app", "pl", "WHERE phone")], status: { pl: "busy" } },
                { note: "Sequential scan: read every row and check it.", tone: "warn", packets: [go("pl", "tb", "scan")], status: { tb: "busy" }, badges: { tb: "1,000,000 rows read" } },
                { note: "1.8 seconds, and it gets slower every day you gain customers.", tone: "bad", packets: [go("pl", "app", "1.8s", "bad")], status: { tb: "bad", pl: "bad" } },
              ],
            },
          },
          learn: {
            what: "A separate sorted structure, usually a B-tree, mapping column values to row locations. Lookups, range scans and ORDER BY on the indexed columns become logarithmic instead of linear.",
            when: "Columns in WHERE, JOIN and ORDER BY clauses on tables that will grow. Foreign keys almost always. Check with EXPLAIN, not intuition.",
            tradeoffs: "Every index slows down every insert and update and takes disk. Low-selectivity columns (a boolean, a status with three values) rarely benefit on their own.",
          },
        },
        {
          id: "composite-index",
          name: "Composite index order",
          story: "A register sorted by class, then surname, finds “JSS2 Adeyemi” instantly. Sorted by surname then class, it doesn't.",
          rule: "Put equality columns first and the range or sort column last, matching how your queries actually filter.",
          demo: {
            kind: "flow",
            scene: {
              title: "WHERE tenant_id = 7 AND created_at > now() - 7d",
              toggle: "(tenant_id, created_at)",
              verdict: { on: "1 range", off: "scanned everyone" },
              nodes: [node("app", "App", "server", 8, 50), node("ix", "Index", "layers", 45, 50), node("tb", "orders · 40M", "disk", 85, 50)],
              edges: [["app", "ix"], ["ix", "tb"]],
              on: [
                { note: "Index on (tenant_id, created_at). Entries are grouped by tenant, then sorted by time.", packets: [go("app", "ix", "tenant 7, last 7d")], status: { ix: "busy" } },
                { note: "Jump to tenant 7, then to last week. Read one contiguous slice.", tone: "ok", status: { ix: "ok" }, badges: { ix: "1 range · 840 entries" } },
                { note: "Fetch 840 rows. Done.", tone: "ok", packets: [go("ix", "tb", "840 rows")], status: { tb: "ok" } },
              ],
              off: [
                { note: "Index on (created_at, tenant_id). Entries are sorted by time first.", packets: [go("app", "ix", "tenant 7, last 7d")], status: { ix: "busy" } },
                { note: "Last week's slice contains every tenant's orders, mixed together.", tone: "warn", badges: { ix: "212,000 entries" } },
                { note: "Read them all and throw away 99.6% that belong to someone else.", tone: "bad", packets: [go("ix", "tb", "filter")], status: { ix: "bad", tb: "busy" } },
              ],
            },
          },
          learn: {
            what: "A multi-column index is sorted by the first column, then the second within it, and so on. It can serve queries that use a left-most prefix of its columns.",
            when: "Multi-tenant tables (tenant_id first, nearly always), and any hot query that filters on one column and sorts or ranges on another.",
            tradeoffs: "An index on (a, b) doesn't help a query on b alone. More columns make a bigger index. Covering indexes (including every selected column) avoid table lookups but cost more on writes.",
            inMyWork: "The multi-tenant products, ZignaLyft and ZignaStay, scope every query by tenant, which is the case this ordering exists for.",
          },
          essay: { href: "/writing/every-query-has-a-landlord", label: "Every Query Has a Landlord" },
        },
        {
          id: "n-plus-one",
          name: "The N+1 query",
          story: "You send the boy to the market fifty times for fifty tomatoes, instead of once with a list.",
          rule: "Load related rows in one query, a join or WHERE id IN (…), instead of one query per row.",
          demo: {
            kind: "flow",
            scene: {
              title: "orders page: 50 orders + their customers",
              toggle: "Eager loading",
              verdict: { on: "2 queries", off: "51 queries" },
              nodes: [node("app", "App", "server", 12, 50), node("db", "Database", "db", 85, 50)],
              edges: [["app", "db"]],
              on: [
                { note: "Get the 50 orders.", packets: [go("app", "db", "SELECT orders")], badges: { app: "1 query" } },
                { note: "Collect their customer IDs and fetch all the customers at once.", tone: "ok", packets: [go("app", "db", "WHERE id IN (…50)")], badges: { app: "2 queries" } },
                { note: "Two round trips. Same page, 8ms.", tone: "ok", packets: [go("db", "app", "50 + 50 rows", "ok")], status: { db: "ok" } },
              ],
              off: [
                { note: "Get the 50 orders.", packets: [go("app", "db", "SELECT orders")], badges: { app: "1 query" } },
                { note: "Render the first order… fetch its customer.", packets: [go("app", "db", "customer 1")], badges: { app: "2 queries" } },
                { note: "…and the next… and the next.", tone: "warn", packets: [go("app", "db", "2"), go("app", "db", "3"), go("app", "db", "4"), go("app", "db", "5")], badges: { app: "6 queries" }, status: { db: "busy" } },
                { note: "51 round trips for one page. Fine on your laptop; 400ms in production.", tone: "bad", packets: [go("app", "db", "…51")], badges: { app: "51 queries" }, status: { db: "bad" } },
              ],
            },
          },
          learn: {
            what: "The pattern where code fetches a list (1 query) and then lazily fetches something for each item (N queries). ORMs make it easy to write by accident: order.customer looks like a property, but it's a query.",
            when: "Look for it on every list page and in every loop that touches the database. Query logging in development makes it obvious.",
            tradeoffs: "Eager loading can over-fetch if you don't need the relation every time, and a huge IN list has limits. Joins can multiply rows; sometimes two simple queries beat one clever one.",
          },
        },
        {
          id: "keyset-pagination",
          name: "Keyset pagination",
          story: "To find page 5,000 of a book, you don't count every page from the start. You use the bookmark.",
          rule: "Page with WHERE id > last_seen ORDER BY id LIMIT n instead of OFFSET, so every page costs the same.",
          demo: {
            kind: "flow",
            scene: {
              title: "GET /transactions?page=5000",
              toggle: "Keyset (cursor)",
              verdict: { on: "20 rows read", off: "100,020 read" },
              nodes: [node("app", "App", "phone", 8, 50), node("db", "Database", "db", 50, 50), node("ix", "id index", "layers", 88, 50)],
              edges: [["app", "db"], ["db", "ix"]],
              on: [
                { note: "The client sends the last ID it saw: after=884213.", packets: [go("app", "db", "id > 884213")] },
                { note: "The index jumps straight there and reads the next 20.", tone: "ok", packets: [go("db", "ix", "seek")], status: { ix: "ok" }, badges: { ix: "20 read" } },
                { note: "Page 5,000 costs exactly what page 1 did. New rows can't shift it either.", tone: "ok", packets: [go("db", "app", "20 rows", "ok")] },
              ],
              off: [
                { note: "OFFSET 100000 LIMIT 20.", packets: [go("app", "db", "OFFSET 100000")] },
                { note: "The database reads 100,020 rows and throws away the first 100,000.", tone: "warn", packets: [go("db", "ix", "walk")], status: { ix: "busy", db: "busy" }, badges: { ix: "100,020 read" } },
                { note: "Meanwhile 5 new transactions arrived. Page boundaries moved, so the user sees 5 rows twice.", tone: "bad", packets: [go("db", "app", "dupes", "bad")], status: { db: "bad" } },
              ],
            },
          },
          learn: {
            what: "Cursor or seek pagination: remember the sort key of the last row returned and ask for rows after it. With an index on the sort key, each page is one index seek.",
            when: "Feeds, transaction histories, infinite scroll, exports and APIs: anything big or changing.",
            tradeoffs: "You can't jump to an arbitrary page number. Sorting by a non-unique column needs a tiebreaker, as in (created_at, id). OFFSET is fine for small admin tables.",
          },
        },
      ],
    },
    {
      title: "Shaping the data",
      entries: [
        {
          id: "normalization",
          name: "Normalisation",
          story: "If Ada's address is written in every order, then when she moves, some orders still go to Surulere.",
          rule: "Store each fact once and reference it by key, so updating it can never leave copies behind.",
          demo: {
            kind: "flow",
            scene: {
              title: "Ada moves from Surulere to Yaba",
              toggle: "Normalised",
              verdict: { on: "1 update", off: "3 addresses" },
              nodes: [node("app", "App", "server", 8, 50), node("cu", "customers", "file", 50, 15), node("o1", "order #1", "file", 88, 30), node("o2", "order #2", "file", 88, 85), node("o3", "order #3", "file", 50, 85)],
              edges: [["app", "cu"], ["cu", "o1"], ["cu", "o2"], ["cu", "o3"]],
              on: [
                { note: "Orders store customer_id. The address lives in one row in customers.", badges: { cu: "Surulere", o1: "→ cust 7", o2: "→ cust 7", o3: "→ cust 7" } },
                { note: "Ada moves. One UPDATE.", packets: [go("app", "cu", "UPDATE")], badges: { cu: "Yaba" }, status: { cu: "ok" } },
                { note: "Every order now resolves to Yaba, because none of them held a copy.", tone: "ok", packets: [go("cu", "o1", "Yaba", "ok"), go("cu", "o2", "Yaba", "ok"), go("cu", "o3", "Yaba", "ok")] },
              ],
              off: [
                { note: "Each order row has its own copy of the address.", badges: { cu: "Surulere", o1: "Surulere", o2: "Surulere", o3: "Surulere" } },
                { note: "Ada moves. The profile and the latest order get updated.", packets: [go("app", "cu", "UPDATE"), go("app", "o3", "UPDATE")], badges: { cu: "Yaba", o3: "Yaba" } },
                { note: "Her standing weekly order still has Surulere. The rider goes to the old house.", tone: "bad", status: { o2: "bad", o1: "bad" } },
              ],
            },
          },
          learn: {
            what: "Organising tables so each fact lives in one place and everything else refers to it by key. The normal forms (1NF, 2NF, 3NF) are a checklist for removing repeated groups and facts that depend on the wrong key.",
            when: "The default for any transactional system. Start normalised; denormalise deliberately, with a reason you can measure.",
            tradeoffs: "More joins at read time. And sometimes a copy is the point: an invoice should keep the address it was sent to, even after the customer moves. That's a snapshot, not duplication.",
          },
        },
        {
          id: "denormalization",
          name: "Deliberate denormalisation",
          story: "The bus conductor keeps a running count of passengers. He doesn't recount the whole bus at every stop.",
          rule: "When a value is read far more than it changes, store it precomputed, and update it in the same transaction as its source.",
          demo: {
            kind: "flow",
            scene: {
              title: "feed: 20 posts with comment counts",
              toggle: "Stored comment_count",
              verdict: { on: "1 query", off: "21 counts" },
              nodes: [node("u", "Feed", "phone", 8, 50), node("api", "API", "server", 40, 50), node("posts", "posts", "file", 82, 15), node("cm", "comments · 9M", "disk", 82, 85)],
              edges: [["u", "api"], ["api", "posts"], ["api", "cm"]],
              on: [
                { note: "A new comment: insert it and increment posts.comment_count, in one transaction.", packets: [go("api", "cm", "INSERT"), go("api", "posts", "+1")], badges: { posts: "count = 13" } },
                { note: "The feed loads 20 posts with their counts already on them.", tone: "ok", packets: [go("u", "api", "GET /feed"), go("api", "posts", "SELECT 20")], status: { posts: "ok" } },
                { note: "One cheap query, however many comments exist.", tone: "ok", packets: [go("api", "u", "6ms", "ok")] },
              ],
              off: [
                { note: "The feed loads 20 posts.", packets: [go("u", "api", "GET /feed"), go("api", "posts", "SELECT 20")] },
                { note: "Then COUNT(*) the comments for each one.", tone: "warn", packets: [go("api", "cm", "COUNT"), go("api", "cm", "COUNT"), go("api", "cm", "COUNT")], status: { cm: "busy" }, badges: { cm: "×20" } },
                { note: "Every scroll of every user recounts millions of rows to show a number that barely changed.", tone: "bad", status: { cm: "bad" }, packets: [go("api", "u", "340ms", "bad")] },
              ],
            },
          },
          learn: {
            what: "Intentionally storing redundant or derived data (counters, totals, a copy of a name) to make hot reads cheap.",
            when: "When you've measured that a read is hot, its inputs change rarely compared with how often it's read, and there's one clear place to keep it in sync.",
            tradeoffs: "Now there are two sources of truth that can drift. Update them in the same transaction, or rebuild from the source on a schedule, and have a way to check they agree.",
          },
        },
        {
          id: "money-in-kobo",
          name: "Money in minor units",
          story: "₦0.10 + ₦0.20 should be ₦0.30. In floating point, it isn't quite.",
          rule: "Store money as an integer count of the smallest unit, kobo, and only format it as naira at the edges.",
          demo: {
            kind: "flow",
            scene: {
              title: "sum one million ₦0.10 fees",
              toggle: "Integer kobo",
              verdict: { on: "₦100,000.00", off: "₦99,999.99…" },
              nodes: [node("api", "Fees", "wallet", 10, 50), node("db", "ledger", "db", 50, 50), node("rep", "Finance report", "file", 88, 50)],
              edges: [["api", "db"], ["db", "rep"]],
              on: [
                { note: "Each fee is stored as 10: ten kobo, an integer.", packets: [go("api", "db", "10"), go("api", "db", "10"), go("api", "db", "10")], badges: { db: "BIGINT" } },
                { note: "A million of them sum to exactly 10,000,000 kobo.", tone: "ok", packets: [go("db", "rep", "10000000")], status: { db: "ok" } },
                { note: "Formatted at the edge: ₦100,000.00. Reconciliation matches to the kobo.", tone: "ok", status: { rep: "ok" }, badges: { rep: "₦100,000.00" } },
              ],
              off: [
                { note: "Each fee is stored as the float 0.1.", packets: [go("api", "db", "0.1"), go("api", "db", "0.1"), go("api", "db", "0.1")], badges: { db: "FLOAT" } },
                { note: "0.1 can't be represented exactly in binary. Every addition rounds a little.", tone: "warn", status: { db: "busy" } },
                { note: "The sum is 100,000.00000133 or so, and the report doesn't match the bank.", tone: "bad", packets: [go("db", "rep", "100000.0000013", "bad")], status: { rep: "bad" }, badges: { rep: "off by kobo" } },
              ],
            },
          },
          learn: {
            what: "Represent amounts as integers in the currency's minor unit (kobo, cents) or as a fixed-point DECIMAL, never as binary floating point. Keep the currency alongside the amount.",
            when: "Every amount of money, every time: prices, balances, fees, FX. Including in JSON: send integers or strings, not floats.",
            tradeoffs: "Division needs an explicit rounding rule (who gets the extra kobo when ₦10 is split three ways?). Display code must format properly. Some currencies have no minor unit, or three decimal places.",
          },
          essay: { href: "/writing/your-naira-has-two-decimal-places", label: "Your Naira Has Two Decimal Places" },
        },
        {
          id: "soft-deletes",
          name: "Soft deletes",
          story: "Don't burn the file. Move it to the archive cabinet and write the date on it.",
          rule: "Mark rows deleted with a timestamp instead of removing them, and filter them out by default.",
          demo: {
            kind: "flow",
            scene: {
              title: "DELETE /members/42: by mistake",
              toggle: "Soft delete",
              verdict: { on: "restored", off: "gone for good" },
              nodes: [node("ad", "Admin", "user", 8, 50), node("api", "API", "server", 40, 50), node("mb", "members", "db", 82, 20), node("pay", "payments", "file", 82, 85)],
              edges: [["ad", "api"], ["api", "mb"], ["mb", "pay"]],
              on: [
                { note: "An admin deletes the wrong member.", packets: [go("ad", "api", "DELETE 42"), go("api", "mb", "SET deleted_at")], badges: { mb: "42 · deleted_at = now" } },
                { note: "Every normal query has WHERE deleted_at IS NULL, so 42 disappears from the app.", status: { mb: "ok" } },
                { note: "Their payment history still points at a real row.", tone: "ok", packets: [go("pay", "mb", "member 42")] },
                { note: "Support clears deleted_at. Restored, with an audit trail of who did what.", tone: "ok", packets: [go("api", "mb", "restore", "ok")], badges: { mb: "42 · active" } },
              ],
              off: [
                { note: "An admin deletes the wrong member.", packets: [go("ad", "api", "DELETE 42"), go("api", "mb", "DELETE")], badges: { mb: "42 · gone" } },
                { note: "Their payments now reference a member who doesn't exist.", tone: "bad", packets: [go("pay", "mb", "member 42?", "bad")], status: { pay: "bad" } },
                { note: "Restoring means digging through last night's backup.", tone: "bad", status: { mb: "bad" } },
              ],
            },
          },
          learn: {
            what: "A deleted_at (or archived_at) column instead of DELETE. Default scopes or views hide deleted rows; restoring is an UPDATE.",
            when: "User-facing records that people delete by accident, records other tables reference, and anything you need for audits or analytics.",
            tradeoffs: "Every query, and every unique index, must account for deleted rows; that's easy to forget. Tables grow forever, and privacy law may require a real delete. Use partial unique indexes and a purge job.",
          },
        },
      ],
    },
    {
      title: "Keeping it honest",
      entries: [
        {
          id: "foreign-keys",
          name: "Foreign keys",
          story: "You can't register a child at a school without a real parent on file.",
          rule: "Let the database refuse references to rows that don't exist, and decide explicitly what happens when a parent is deleted.",
          demo: {
            kind: "flow",
            scene: {
              title: "DELETE FROM customers WHERE id = 7",
              toggle: "Foreign key",
              verdict: { on: "refused", off: "orphans" },
              nodes: [node("app", "App", "server", 8, 50), node("cu", "customers", "db", 50, 50), node("o", "orders (12)", "file", 88, 50)],
              edges: [["app", "cu"], ["cu", "o"]],
              on: [
                { note: "A cleanup script tries to delete customer 7.", packets: [go("app", "cu", "DELETE 7")] },
                { note: "The database checks: 12 orders reference customer 7, ON DELETE RESTRICT.", tone: "warn", packets: [go("cu", "o", "check")], status: { cu: "busy" } },
                { note: "Refused. The bug surfaces as an error in the script, not in next month's report.", tone: "ok", packets: [go("cu", "app", "23503", "ok")], status: { cu: "ok", o: "ok" } },
              ],
              off: [
                { note: "A cleanup script tries to delete customer 7.", packets: [go("app", "cu", "DELETE 7")] },
                { note: "Nothing stops it.", tone: "warn", status: { cu: "ok" }, badges: { cu: "7 deleted" } },
                { note: "Twelve orders now point at nobody. Revenue reports crash on a null customer.", tone: "bad", status: { o: "bad" }, badges: { o: "12 orphans" } },
              ],
            },
          },
          learn: {
            what: "A constraint that a column's value must exist in another table's key. You choose the delete behaviour: RESTRICT (refuse), CASCADE (delete children), SET NULL.",
            when: "Every relationship inside one database, by default. The database is the only layer that sees every write, from every service, script and console session.",
            tradeoffs: "A small write cost, and bulk loads must happen in order. CASCADE is powerful and dangerous. One delete can remove a lot. Constraints don't work across separate databases.",
          },
        },
        {
          id: "check-constraints",
          name: "Check constraints",
          story: "The shop shelf can't hold minus three tins of milk. Neither should the stock table.",
          rule: "Write the rules that must always be true (no negative stock, end after start) as constraints the database enforces.",
          demo: {
            kind: "flow",
            scene: {
              title: "two cashiers sell the last tin",
              toggle: "CHECK (stock >= 0)",
              verdict: { on: "oversell blocked", off: "stock = −1" },
              nodes: [node("c1", "Cashier 1", "wallet", 8, 18), node("c2", "Cashier 2", "wallet", 8, 82), node("db", "inventory", "db", 70, 50)],
              edges: [["c1", "db"], ["c2", "db"]],
              on: [
                { note: "One tin left. Both cashiers' screens say “in stock”.", badges: { db: "stock = 1" } },
                { note: "Both run UPDATE stock = stock − 1.", packets: [go("c1", "db", "−1"), go("c2", "db", "−1")], status: { db: "busy" } },
                { note: "The first succeeds. The second would make stock −1, and the constraint rejects it.", tone: "ok", packets: [go("db", "c1", "ok", "ok"), go("db", "c2", "rejected", "warn")], status: { db: "ok" }, badges: { db: "stock = 0" } },
                { note: "Cashier 2 tells the customer it's sold out, before taking their money.", tone: "ok" },
              ],
              off: [
                { note: "One tin left. Both cashiers' screens say “in stock”.", badges: { db: "stock = 1" } },
                { note: "Both run UPDATE stock = stock − 1.", packets: [go("c1", "db", "−1"), go("c2", "db", "−1")], status: { db: "busy" } },
                { note: "Both succeed. You've sold a tin of milk you don't have.", tone: "bad", status: { db: "bad" }, badges: { db: "stock = −1" } },
              ],
            },
          },
          learn: {
            what: "A CHECK constraint is a boolean expression the database evaluates on every insert and update of a row: CHECK (stock >= 0), CHECK (ends_at > starts_at), CHECK (amount_kobo > 0).",
            when: "For invariants that involve one row. They're cheap, they document intent, and they protect you from every code path at once, including the one you'll write next year.",
            tradeoffs: "They only see one row, so cross-row rules (no overlapping bookings) need exclusion constraints, unique indexes or locking. Error messages are generic, so map them to friendly ones in the app.",
            inMyWork: "The business operations platform keeps its invariants in database constraints, so no screen or script can skip them.",
          },
          essay: { href: "/work/business-operations-platform", label: "Case study: business operations platform" },
        },
        {
          id: "isolation-levels",
          name: "Isolation levels",
          story: "You count the cash in the till while someone is moving notes between drawers. Your total is wrong, and nobody stole anything.",
          rule: "Choose how much of other transactions' work yours can see, and use a snapshot for anything that reads the same data twice.",
          demo: {
            kind: "flow",
            scene: {
              title: "end-of-day report vs a live transfer",
              toggle: "Repeatable read",
              verdict: { on: "₦30,000 both times", off: "₦25,000?!" },
              nodes: [node("rep", "Report txn", "file", 10, 50), node("db", "accounts", "db", 50, 50), node("tx", "Transfer txn", "wallet", 90, 50)],
              edges: [["rep", "db"], ["tx", "db"]],
              on: [
                { note: "The report starts and takes a snapshot. It sums account A: ₦10,000.", packets: [go("rep", "db", "SUM A")], badges: { db: "A 10k · B 20k", rep: "A = 10k" } },
                { note: "A transfer moves ₦5,000 from B to A, and commits.", packets: [go("tx", "db", "B→A ₦5k")], badges: { db: "A 15k · B 15k" } },
                { note: "The report reads B from its snapshot: ₦20,000.", tone: "ok", packets: [go("db", "rep", "B = 20k", "ok")] },
                { note: "Total ₦30,000, a consistent view of one moment in time.", tone: "ok", badges: { rep: "₦30,000" }, status: { rep: "ok" } },
              ],
              off: [
                { note: "READ COMMITTED. The report sums account A: ₦10,000.", packets: [go("rep", "db", "SUM A")], badges: { db: "A 10k · B 20k", rep: "A = 10k" } },
                { note: "A transfer moves ₦5,000 from B to A, and commits.", packets: [go("tx", "db", "B→A ₦5k")], badges: { db: "A 15k · B 15k" } },
                { note: "The report reads B fresh: ₦15,000.", tone: "warn", packets: [go("db", "rep", "B = 15k")] },
                { note: "Total ₦25,000. Five thousand naira vanished from the report, though no money moved out.", tone: "bad", badges: { rep: "₦25,000" }, status: { rep: "bad" } },
              ],
            },
          },
          learn: {
            what: "The SQL isolation levels (read committed, repeatable read, serializable) decide which anomalies are possible: dirty reads, non-repeatable reads, phantoms, write skew. Higher levels prevent more and cost more.",
            when: "Reports and multi-step reads want a snapshot (repeatable read). Read-modify-write logic wants row locks (SELECT … FOR UPDATE) or serializable, with a retry loop.",
            tradeoffs: "Stronger isolation means more lock waits or serialisation failures you must retry. Defaults differ: Postgres defaults to read committed, MySQL InnoDB to repeatable read.",
          },
        },
        {
          id: "mvcc",
          name: "MVCC",
          story: "The editor revises the article while readers keep reading this morning's printed edition. Nobody waits for the printing press.",
          rule: "Keep old versions of rows so readers see a consistent snapshot without blocking writers, and writers don't block readers.",
          demo: {
            kind: "flow",
            scene: {
              title: "a slow report while prices change",
              toggle: "Multi-version rows",
              verdict: { on: "no waiting", off: "blocked 4s" },
              nodes: [node("rd", "Report", "file", 10, 20), node("wr", "Price update", "server", 10, 80), node("v1", "row v1 · ₦2,500", "layers", 70, 20), node("v2", "row v2 · ₦3,000", "layers", 70, 80)],
              edges: [["rd", "v1"], ["wr", "v2"], ["v1", "v2"]],
              on: [
                { note: "The report starts reading the menu table.", packets: [go("rd", "v1", "read")], status: { v1: "ok" } },
                { note: "Meanwhile a price update writes a new version of the row. The old one stays.", packets: [go("wr", "v2", "UPDATE")], status: { v2: "ok" }, badges: { v2: "new" } },
                { note: "The report keeps seeing v1, the snapshot it started with. Nobody waited.", tone: "ok", packets: [go("v1", "rd", "₦2,500", "ok")] },
                { note: "New transactions see v2. Vacuum cleans up v1 once nobody needs it.", tone: "ok", status: { v1: "idle" } },
              ],
              off: [
                { note: "The report takes a shared lock on the menu table.", packets: [go("rd", "v1", "LOCK S")], status: { v1: "busy" }, badges: { v1: "locked" } },
                { note: "A price update needs an exclusive lock. It waits.", tone: "warn", packets: [go("wr", "v1", "LOCK X?")], status: { wr: "busy" } },
                { note: "Four seconds of nobody being able to change a price, because someone ran a report.", tone: "bad", status: { wr: "bad" }, badges: { wr: "waiting 4s" } },
              ],
            },
          },
          learn: {
            what: "Multi-version concurrency control: an update writes a new version of the row tagged with its transaction ID. Each transaction reads the versions visible to its snapshot. Postgres, MySQL InnoDB and Oracle all work this way.",
            when: "You're using it already. Understanding it explains why long-running transactions bloat tables, why vacuum exists, and why readers almost never block.",
            tradeoffs: "Old versions take space until cleaned up, so long-open transactions hurt the whole database. Writers still block other writers on the same row.",
          },
        },
        {
          id: "wal",
          name: "Write-ahead log",
          story: "Before cooking, the chef writes the order on the ticket rail. If the kitchen loses power, the tickets say what was promised.",
          rule: "Append every change to a durable log before applying it, so after a crash the database replays the log and loses nothing it acknowledged.",
          demo: {
            kind: "flow",
            scene: {
              title: "COMMIT: then the power goes",
              toggle: "Write-ahead log",
              verdict: { on: "recovered", off: "lost a payment" },
              nodes: [node("app", "App", "server", 8, 50), node("mem", "Memory", "layers", 42, 20), node("wal", "WAL on disk", "file", 42, 85), node("data", "Data files", "disk", 88, 50)],
              edges: [["app", "mem"], ["app", "wal"], ["mem", "data"], ["wal", "data"]],
              on: [
                { note: "A payment commits. The change is appended to the WAL and fsynced.", packets: [go("app", "wal", "append + fsync")], status: { wal: "ok" }, badges: { wal: "LSN 9081" } },
                { note: "Then it's applied in memory. Only then: “committed”.", packets: [go("app", "mem", "apply")], status: { mem: "ok" } },
                { note: "The power fails before memory was flushed to the data files.", tone: "bad", status: { mem: "down", data: "idle" } },
                { note: "On restart, the database replays the WAL from the last checkpoint. The payment is there.", tone: "ok", packets: [go("wal", "data", "replay", "ok")], status: { data: "ok", mem: "ok" } },
              ],
              off: [
                { note: "A payment commits. The change is applied in memory and acknowledged.", packets: [go("app", "mem", "apply")], status: { mem: "ok" } },
                { note: "Flushing to disk happens “later”, in the background.", tone: "warn", badges: { mem: "dirty" } },
                { note: "The power fails first. Memory is gone, and the payment with it.", tone: "bad", status: { mem: "down", data: "bad" }, badges: { data: "no record" } },
              ],
            },
          },
          learn: {
            what: "The write-ahead log (redo log, journal) is an append-only file of every change. Sequential appends are fast to fsync; data pages are written lazily. Crash recovery replays the log since the last checkpoint.",
            when: "It's inside every serious database. It's also the foundation of replication, point-in-time recovery and change-data capture.",
            tradeoffs: "Turning off fsync or using async commit trades durability for speed, sometimes acceptable, never for money. WAL volume drives replication bandwidth and backup size.",
          },
        },
      ],
    },
    {
      title: "Operating it",
      entries: [
        {
          id: "connection-pooling",
          name: "Connection pooling",
          story: "Keep a few keke drivers waiting at the junction instead of calling a new one from home for every passenger.",
          rule: "Reuse a small, fixed set of database connections across requests instead of opening one per request.",
          demo: {
            kind: "flow",
            scene: {
              title: "3 app instances × 50 concurrent requests",
              toggle: "Pool of 10 each",
              verdict: { on: "30 connections", off: "too many clients" },
              nodes: [node("a1", "App 1", "server", 10, 15), node("a2", "App 2", "server", 10, 50), node("a3", "App 3", "server", 10, 85), node("pool", "Pools", "layers", 48, 50), node("db", "Postgres · max 100", "db", 88, 50)],
              edges: [["a1", "pool"], ["a2", "pool"], ["a3", "pool"], ["pool", "db"]],
              on: [
                { note: "150 requests arrive across three instances.", packets: [go("a1", "pool", "50"), go("a2", "pool", "50"), go("a3", "pool", "50")] },
                { note: "Each instance has 10 open connections. Requests borrow one, use it for milliseconds, and return it.", tone: "ok", packets: [go("pool", "db", "30 conns")], status: { pool: "ok" }, badges: { db: "30 / 100" } },
                { note: "No handshake per request. The database stays well under its limit.", tone: "ok", status: { db: "ok" } },
              ],
              off: [
                { note: "150 requests arrive across three instances.", packets: [go("a1", "pool", "50"), go("a2", "pool", "50"), go("a3", "pool", "50")] },
                { note: "Each opens its own connection: TCP, TLS, auth, 30ms before the first query.", tone: "warn", packets: [go("pool", "db", "150 conns")], status: { db: "busy" }, badges: { db: "100 / 100" } },
                { note: "Connection 101 is refused: FATAL: too many clients already.", tone: "bad", status: { db: "bad" }, packets: [go("db", "pool", "FATAL", "bad")] },
              ],
            },
          },
          learn: {
            what: "A pool keeps N open connections and hands them out to requests. Most drivers and ORMs (Sequelize, Prisma, pgx, database/sql) have one built in; PgBouncer pools across processes.",
            when: "Always, for any server that talks to a relational database. Especially with serverless functions or many small instances, which multiply connections fast.",
            tradeoffs: "Size the pool to what the database can handle across every instance, not to your request concurrency. A leaked connection, never returned, starves the pool, so set acquire timeouts.",
          },
        },
        {
          id: "zero-downtime-migrations",
          name: "Zero-downtime migrations",
          story: "To rename a street, put up the new sign beside the old one. Take the old one down only when every map has been reprinted.",
          rule: "Expand, migrate, contract: add the new shape, write to both, backfill, switch reads, and only later remove the old.",
          demo: {
            kind: "flow",
            scene: {
              title: "rename column phone → phone_e164",
              toggle: "Expand / contract",
              verdict: { on: "no errors", off: "500s mid-deploy" },
              nodes: [node("v1", "App v1 (old)", "server", 10, 18), node("v2", "App v2 (new)", "server", 10, 82), node("db", "users table", "db", 70, 50)],
              edges: [["v1", "db"], ["v2", "db"]],
              on: [
                { note: "Expand: add phone_e164. v1 keeps working; it doesn't know the column exists.", packets: [go("v2", "db", "ADD COLUMN")], badges: { db: "phone + phone_e164" } },
                { note: "Deploy v2, which writes both columns and reads the new one. v1 and v2 run side by side.", packets: [go("v1", "db", "phone"), go("v2", "db", "both")], status: { v1: "ok", v2: "ok" } },
                { note: "Backfill old rows in small batches.", packets: [go("v2", "db", "backfill")], status: { db: "busy" } },
                { note: "Once v1 is gone and nothing reads phone, a later release drops it.", tone: "ok", status: { v1: "down", db: "ok" }, badges: { db: "phone_e164" } },
              ],
              off: [
                { note: "The deploy runs ALTER TABLE … RENAME COLUMN first.", packets: [go("v2", "db", "RENAME")], badges: { db: "phone_e164" } },
                { note: "Half the instances are still v1, querying phone.", tone: "warn", packets: [go("v1", "db", "SELECT phone")] },
                { note: "column “phone” does not exist. Every v1 request fails until the rollout finishes.", tone: "bad", status: { v1: "bad" }, packets: [go("db", "v1", "ERROR", "bad")] },
              ],
            },
          },
          learn: {
            what: "During a rolling deploy, old and new code run against the same database. Every schema change must be compatible with both. So destructive changes are split into additive steps spread over several releases.",
            when: "Renames, type changes, splitting tables, adding NOT NULL columns, anything on a table the running app uses.",
            tradeoffs: "Several releases instead of one, and temporary dual-write code to clean up. On big tables, even an additive change can lock it, check what your database does for each ALTER.",
          },
        },
      ],
    },
  ],
};
