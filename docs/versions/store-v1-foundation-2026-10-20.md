# Store v1 — secure foundation

## Current implementation — October 14, 2026

The owner approved Neon Postgres, the official serverless driver, parameterized SQL, versioned migrations and no ORM, then confirmed that Stripe and Neon are integrated in Vercel and authorized implementation without local credentials. The existing approved Stripe resource remains `stripe-sandbox-vercel-test`. No new resource, account, integration, environment variable or deployment has been created.

### Configuration truth

The repository remains locally unlinked to Vercel. The owner has verified the remote integrations; this session has not independently inspected them. The owner supplied these Stripe variable names: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_MCP_KEY`, and these Neon variable names: `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. No credential values were supplied or inspected. Stripe credential validity/account identity, Neon branch and remote connectivity remain unverified.

`src/lib/commerce/environment.mjs` holds **variable-name bindings only**. The Stripe server client binds to the owner-confirmed `STRIPE_SECRET_KEY` and the Neon utilities bind to `DATABASE_URL`. `DATABASE_URL_UNPOOLED` is available according to the owner but is not used by the current utilities or transactional migration runner. The webhook signing-secret binding remains `null` until its actual name is known and a test endpoint is registered. No credential values are copied into source or duplicated in Vercel. A `NEXT_PUBLIC_` credential binding is rejected. No publishable key, browser Stripe SDK or MCP key is used for hosted Checkout.

Stripe initialization is lazy and rejects every credential except secret/restricted **test** keys. This enforces test-mode capability without claiming that the existing remote key was inspected. Client initialization makes no API requests and does not prove provider authentication. Neon initialization is lazy, accepts only PostgreSQL URLs on Neon hosts with `sslmode=require`, and never prints a connection string. Both modules have `server-only` guards. Neither is imported by an existing public page or Client Component.

### Packages installed

- Runtime: `stripe` 23.0.0, `@neondatabase/serverless` 1.2.0, `server-only` 0.0.1; exact installed resolutions are in the lockfile.
- Development only: `@electric-sql/pglite` for disposable in-memory PostgreSQL schema/migration tests. It is not an application database, ORM, hosted resource or fallback to Neon.

### Created files and responsibilities

| Files | Purpose |
| --- | --- |
| `src/lib/commerce/environment.mjs` | Explicit integration name mapping, sanitized configuration errors, test-only Stripe and encrypted Neon guards. |
| `src/lib/commerce/stripe.mjs` | Lazy server-only official Stripe test client; rechecks mode on each access. |
| `src/lib/commerce/database.mjs` | Server-only parameterized HTTP query utility and per-transaction Neon client using native Node WebSocket support. |
| `src/lib/commerce/cart.mjs` | ID/quantity contract, persistent-cart storage key, item/quantity/body limits; rejects injected price fields and duplicate IDs. |
| `src/lib/commerce/catalog.mjs` | Read-only bound-parameter cart product query; price, type, status and available inventory come from the database. This does not reserve inventory or authorize checkout. |
| `src/lib/commerce/types.ts` | Product/cart and lifecycle type contracts. |
| `src/lib/commerce/webhook.mjs`, `src/app/api/stripe/webhook/route.ts` | Node-runtime POST route, bounded untouched body, Stripe signature verification, test-only event guard, and unavailable responses until durable payment handling exists. |
| `db/migrations/0001_store_foundation.sql` | Initial namespaced commerce schema, constraints, indexes and timestamp triggers. |
| `scripts/commerce-migration-core.mjs`, `scripts/commerce-migrate.mjs` | Transactional migration runner with advisory lock, checksums, history validation and explicit apply mode. |
| `tests/commerce/server.node.mjs`, `tests/commerce/schema.node.mjs`, `tests/commerce-route.spec.ts` | Focused server, SQL migration/constraint and production-route tests. |

Modified files: `package.json`, `package-lock.json`, this report and `docs/version-history.md`. Existing pages, navigation, design, contact system, SEO, animations and routes are unchanged. The only new route is `/api/stripe/webhook`. No Store page, cart UI or checkout endpoint exists.

### Schema defined and tested locally, not applied to Neon

All tables are under a separate `commerce` schema:

- `products`: all requested catalog fields, physical/digital type, nonnegative integer cents/stock, draft/active/archived status, optional weight and shipping JSON, timestamps. Digital products cannot carry physical shipping data.
- `product_images`: ordered multiple image references and alt text, without binary image data or a storage-provider integration.
- `orders`: internal ID, unique retry ID, unique nullable Checkout Session and Payment Intent IDs, payment/fulfillment statuses, customer email, cent totals, currency, timestamps and a **TEST-only** database constraint. For this phase total equals subtotal plus shipping; discounts/taxes need explicit future fields and rules.
- `order_items`: product/order references, purchase-name/type/price snapshots and positive quantities. Catalog edits do not modify snapshots; referenced products cannot be deleted. Archive products instead.
- `inventory_reservations`: separate per-order/product quantity, ACTIVE/RELEASED/CONSUMED status, expiration and timestamps. Each reservation references an existing order item with the same quantity.
- `stripe_events`: unique processed event ID, type, TEST-only mode, optional order reference and processing timestamp. No full event payloads or payment-card data.
- `schema_migrations`: version/checksum/applied timestamp ledger maintained by the runner.

No test products were added to the application or Neon. Shipping/carrier rules and APIs are deferred.

### Migration commands

`npm run commerce:migrations` lists repository migration filenames without accessing a database. It is not a remote migration-status check. Applying requires `DATABASE_URL` credentials available to the process and a confirmed isolated test database:

```sh
npm run commerce:migrations -- --apply --confirm-test-database
```

The runner does not load local secret files itself. Use securely supplied process variables or the linked Vercel CLI environment when ready. The confirmation flag acknowledges the target database; a connection-string hostname cannot prove branch isolation. No automatic migration runs during build, request handling or deployment. Applying holds a transaction-scoped PostgreSQL advisory lock, verifies historical checksums, applies only unapplied trusted SQL, records versions, and rolls back DDL/history together on failure. Existing migration files must never be edited after application; add a new numbered file. SQL file execution is trusted repository code; application values and migration-ledger values are bound parameters.

### Cart, reservations and future payments

The cart module defines multiple IDs/quantities, excludes browser-supplied prices and provides a versioned browser-storage key. Add/remove/update and persistence UI are still future work. A quantity of 99 is only a request bound, never an assertion about available stock. One-of-one enforcement must come from a database reservation transaction. Digital goods use the same stock policy for now; unlimited digital licensing is a separate future decision.

The selected inventory architecture uses separate reservations so multiple-quantity products and one-of-one items share one model. AVAILABLE means stock minus ACTIVE reservations; SOLD means committed stock is depleted. The read query counts expired-but-ACTIVE reservations because a timestamp alone does not establish that Stripe can no longer accept payment.

**The schema alone does not prevent overselling.** Before checkout is exposed, implement a single transaction that locks products in stable ID order, validates active status, available stock and prices, creates a pending order/items and reserves the entire cart or nothing. Every stock writer/releaser must follow the same locks. Bind one Session using order-derived Stripe idempotency, outside the lock transaction. Reconcile ambiguous Session creation and expiration before releasing stock. Confirm definitive payment outcomes, deduplicate events and transition order/reservations/stock atomically. Implement recovery for missed/out-of-order events and orphaned reservations. Adding a browser cart item never reserves stock.

Concurrent buyers, replayed events, expiration/payment races and all-or-nothing reservations must be tested against a real transactional Postgres test target before enabling checkout. PGlite validates SQL behavior here but its single connection does not verify multi-connection Neon contention.

### Webhook activation requirements

The preparatory route verifies raw-body signatures if configured and rejects live events. It currently returns **503 for every valid sandbox event**, including repeated payments, because no durable payment handler is enabled. It cannot mark an order paid, fulfill anything or acknowledge unprocessed payments. Missing configuration returns 503, malformed/signature-invalid events 400, oversized bodies 413. Do not register it for event delivery yet.

After the handler is completed and a deployment is authorized, the sandbox destination on the existing canonical hostname is `https://www.emiliosierra.com/api/stripe/webhook`. An isolated preview would use its actual deployment hostname, which has not been supplied. Register only in `stripe-sandbox-vercel-test`; use that endpoint's signing secret through the existing secure environment configuration. No signing secret has been invented or added. Local test signatures use explicit synthetic fixtures only.

Activation still requires durable/idempotent order updates, event deduplication in the same transaction as stock/payment changes, Session/order/currency/amount checks, recovery/reconciliation, real sandbox integration tests and a configured endpoint-specific signing secret. Visiting a success URL will never confirm payment. Hosted Checkout keeps card numbers and CVC outside this application.

### Current validation

Production build, lint and TypeScript passed. All 13 focused commerce tests passed, executing the migration and constraints on disposable in-memory PostgreSQL and mocking provider interactions. All 19 Playwright tests passed across the standard suite (15 passed, four intentionally skipped) and the isolated configured inquiry UI run (four passed with dummy credentials and mocked delivery). This totals 32 tests. Playwright initially discovered the Node-only test files; their filenames were separated from its discovery pattern and the complete browser suite then passed. No real Stripe API requests, charges, Neon connections, emails or deployment occurred. The generated `next-env.d.ts` build change was restored.

Dependency installation reports seven high-severity audit findings in existing Next.js/lint/source-map dependencies; none are in the newly installed commerce packages. These existing versions were preserved to honor the infrastructure-only scope. Dependency security maintenance remains a separate follow-up before checkout activation. Node 22.12 also reports the repository's existing lint dependency engine warning requiring Node 22.13+.

## Previous audit and proposal — October 13, 2026

October 13, 2026. Audit of the local checkout; this is a proposal, not an implemented storefront. No deployment, payment request, database connection, migration, or environment-variable change was performed.

## Findings before implementation

| Item | Result available to this session |
| --- | --- |
| Stripe environment variable names | None in the application process or local environment files. |
| Neon environment variable names | None in the application process or local environment files. |
| `STRIPE_SECRET_KEY` | Not locally available; remote availability and sandbox mode unverified. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Not locally available; remote availability unverified. Hosted Checkout does not require a browser Stripe SDK. |
| `STRIPE_WEBHOOK_SECRET` | Not locally available; expected at this phase. |
| Database connection variable | None locally available, including `DATABASE_URL`; the actual integration-provided name is unknown. |
| Database library / ORM | None in source, package manifest, or lockfile. |
| Stripe packages | None in package manifest or lockfile. |
| Vercel configuration access | No `.vercel/project.json`, installed Vercel CLI, CLI authentication at its standard macOS location, or available Vercel connector. Remote project settings were not inspected. |

The sole local environment file is `.env.example`, containing only `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL`, and `INQUIRY_SITE_ORIGIN`. These are the existing inquiry settings. No secret values were printed or added to this report.

The owner reports that the integrations are connected in Vercel. Missing local variables do **not** establish that those remote integrations are broken. Environment targeting (Development / Preview / Production), connection names, database branch, Stripe sandbox account, and credentials still need verification in the linked Vercel project. Existing Vercel variables must be reused rather than duplicated. Do not paste credentials into chat.

The requested stop condition applies: there is no database architecture to reuse. Database selection, SDK installation, server clients, and new API routes are deferred until the approach is agreed and configuration can be verified. No complete foundation is claimed.

## Recommended database approach (awaiting selection)

Use Neon Postgres with its official `@neondatabase/serverless` driver and small, versioned SQL migrations, without adding an ORM. Use parameterized tagged templates or bound query parameters exclusively. HTTP queries suit catalog reads; transactional checkout reservations need either a single atomic database operation or the driver's transaction-capable client. Do not compose related checkout writes as independent requests.

The database connection belongs in a module guarded with `import 'server-only'`, using the verified integration-provided variable name. No database credential may have a `NEXT_PUBLIC_` prefix. Use an isolated Neon branch for commerce testing and a least-privilege application role; run migrations separately with appropriate permissions. Do not add customer accounts or authentication for guest checkout.

Proposed schema, not applied:

| Table | Required data and constraints |
| --- | --- |
| `products` | UUID ID, unique slug, name, description, integer price in cents, currency, category, condition, physical/digital type, nonnegative inventory quantity, catalog status, images, optional weight/shipping data, created/updated timestamps. |
| `orders` | UUID ID, unique nullable Checkout Session ID, payment and fulfillment statuses, customer email, integer subtotal/shipping/total, currency, created/updated timestamps. Keep sandbox records separate from any future live records. |
| `order_items` | Order/product foreign keys, immutable product name and price at purchase, positive integer quantity; preserve purchase snapshots if catalog data changes. |
| `inventory_reservations` | Order/product references, quantity, reservation state, expiry, created/updated timestamps, unique order/product pair. Needed for safe multi-item checkout. |
| `stripe_events` | Unique Stripe event ID, processing status and timestamps, for durable deduplication in the same transaction as payment/inventory changes. Avoid retaining full event payloads unnecessarily. |

Money uses integer minor units throughout. Enforce constraints in Postgres as well as the server. Deleting a product must not erase order history.

## Minimal files proposed after the stop condition is resolved

| File | Purpose |
| --- | --- |
| `package.json`, `package-lock.json` | Add official `stripe`, explicit `server-only`, and the selected database driver; no browser Stripe package needed initially. |
| `src/lib/commerce/stripe.ts` | Lazy server-only SDK client so builds work without credentials. Require a test secret key; reject live keys and missing configuration with sanitized errors. |
| `src/lib/commerce/database.ts` | Server-only connection using the verified existing variable name. |
| `src/lib/commerce/checkout-validation.ts` | Strict IDs/quantities validation and bounded requests, independent of browser totals. |
| `src/lib/commerce/types.ts` | Cart input and catalog/order contracts. |
| `src/app/api/stripe/webhook/route.ts` | Node-runtime raw-body signature verification and test-mode gate; unavailable until configured and durable processing exists. |
| `tests/commerce-server.spec.ts` | Missing/live-key rejection, signature tampering, invalid cart input, sanitized failure responses, and fail-closed behavior without providers. |
| `docs/store-v1-foundation.md`, `docs/version-history.md` | Audit, configuration boundaries, implementation decisions and validation. |

After database selection, propose numbered SQL migration files and transaction-based reservation tests. A future checkout endpoint and cart UI are later work. Do not change existing pages, public navigation, inquiry code, styles, SEO, animations, historical prompts, or routes. A new webhook route must not return success for an event requiring order processing until its work is durably committed.

## Cart and server checkout contract

Persist a guest cart in browser storage as product IDs and positive integer quantities. Support add, remove and quantity update; do not persist payment information. Display prices and availability from a server catalog response, and refresh stale data on return/reload. Displayed subtotal is informational.

A future checkout request contains only IDs and quantities, plus a retry token. Reject unknown fields, malformed IDs, duplicate IDs or normalize duplicates before validating combined quantities; enforce item, quantity and body-size limits. The server must fetch current active products, actual prices, product types and inventory, calculate amounts, and reserve every requested item atomically. Fail the entire cart if any item cannot be reserved. A one-of-one item cannot have a combined quantity above one. Add origin checks and durable abuse limits before exposing checkout.

Create one hosted Stripe Checkout Session with mixed line items from the database snapshots. The server determines currency, shipping options, totals and return URLs. Physical items collect necessary shipping data; digital delivery occurs only after confirmed payment. No checkout endpoint exists yet, so price, SQL and inventory protections are design requirements rather than verified implementation.

## Inventory lifecycle and concurrent checkout

`AVAILABLE` means sellable stock minus active reservations is positive. `RESERVED` means stock is allocated to a pending order. `SOLD` means payment has committed a sale; a one-of-one item has no remaining stock. Catalog visibility and payment/fulfillment statuses remain separate from these inventory states.

Reserve all cart rows in a single Postgres transaction, locking product rows in stable ID order to avoid deadlocks. Check unreserved stock under those locks, then persist the pending order, price snapshots and reservations. Every stock mutation and reservation release must use the same locking rules. Concurrent buyers for quantity-one stock cannot both obtain a reservation. An in-memory flag or browser cart is insufficient across Vercel instances.

Do not keep database locks open while contacting Stripe. Commit the reservation first, then create the Session using an order-derived Stripe idempotency key and bind its ID durably. Ambiguous network failures must be reconciled using that same key, rather than creating another Session or releasing stock prematurely. Recover pending orders whose Session creation/binding was interrupted.

Release stock only when Stripe confirms the Session cannot complete and no payment is pending. A local expiry timer alone is insufficient: it could release an item while payment succeeds and its webhook is delayed. Reconcile expiration against Stripe, expire open Sessions when safe, and release reservations atomically/idempotently. Delayed payment methods require holding the reservation until definitive success/failure; initially restrict checkout to immediate methods while retaining recovery handling. Periodic reconciliation must cover missed events and orphaned reservations. Late/out-of-order events must never resurrect released stock or repeat a sale; quarantine inconsistent cases for review.

Required future database tests include two simultaneous buyers for stock one (exactly one reservation succeeds), all-or-nothing multi-item reservation, duplicate checkout retries, interrupted Session creation, replayed/out-of-order events, and payment racing expiration. This safety is not yet implemented.

## Webhook preparation and registration

The proposed path is `/api/stripe/webhook`. Read the untouched request body and verify `Stripe-Signature` with the official SDK and the endpoint-specific signing secret. Reject live-mode events during this phase. Return sanitized failures; do not log secrets, raw payloads, email addresses or provider exceptions.

Handle `checkout.session.completed` only as paid when the payment state confirms payment; handle asynchronous success/failure and Session expiration as appropriate. Verify Session/order binding, sandbox mode, expected currency and amounts before fulfillment. Persist the unique event and transition the order, reservations and stock in one transaction. Stripe retries and out-of-order delivery must be safe. Return a retryable failure if required processing is unavailable; do not falsely acknowledge an unprocessed payment. A browser visit to a success URL never marks an order paid.

After the endpoint and durable handler exist and are deployed with authorization, register a **sandbox/test** destination at `https://www.emiliosierra.com/api/stripe/webhook` if using the production hostname for sandbox traffic. For an isolated test deployment, use `https://<actual-test-deployment-host>/api/stripe/webhook`; no test deployment hostname has been supplied or invented. Do not register or enable a live-mode destination in this phase. Local testing can forward Stripe CLI events to `http://localhost:3000/api/stripe/webhook`.

Each registered endpoint has its own `STRIPE_WEBHOOK_SECRET`; local CLI forwarding has a distinct signing secret. Reuse the existing variable if already supplied and configure only the missing signing secret through secure environment management. Never invent a secret or reuse one from another endpoint.

## Security verification boundary

- `.gitignore` ignores `.env*` except `.env.example`; no real environment file or Vercel settings file is tracked.
- A pattern scan of tracked text files found no Stripe secret/signing-key or credentialed Postgres-URL patterns. This is not a guarantee about Git history, binary archives, remote Vercel configuration, or all possible secret formats.
- No Stripe/Neon credentials are currently referenced by client source. Server-only imports and test-only guards must be checked when clients are implemented.
- There are no commerce endpoints, SQL queries, inventory writes or order-payment mutations to security-test yet. Browser pricing, parameterized SQL, validated checkout, concurrent inventory safety and authoritative payment handling remain pending implementation.
- Use Stripe-hosted Checkout; EmilioSierra.com must never receive or store payment-card numbers or CVC. Retain only necessary order, shipping and provider identifiers, with access controls and an appropriate retention policy.

## References

- [Neon official serverless driver](https://neon.com/docs/serverless/serverless-driver)
- [Stripe official Node SDK](https://github.com/stripe/stripe-node)
- [Stripe API keys and test/live separation](https://docs.stripe.com/keys)
- [Vercel environment-variable scopes](https://vercel.com/docs/environment-variables)

## Validation

Production build, ESLint and TypeScript passed. All 18 existing tests passed across the standard suite, isolated inquiry UI run with dummy credentials and mocked responses, and focused reruns. The standard suite initially had two browser navigation failures (Chrome network I/O suspension and navigation timeout); both passed on an isolated one-worker rerun with a 60-second timeout. Its four deliberately skipped inquiry UI tests passed in the isolated configured run. The six inquiry server tests also passed independently. No real inquiry emails were sent. Browser servers required permission to listen outside the filesystem sandbox; no deployment was performed.

Only this report and the version-history entry were added/edited. The build regenerated `next-env.d.ts`; its original contents were restored. No commerce tests are claimed because commerce code has not been introduced.
