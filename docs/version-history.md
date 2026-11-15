# Design versions

Keep previous prompts unchanged. Add a dated entry here for each major version, recording the new brief, the visible changes, the features carried forward, and validation. Version labels for the earlier incremental updates below are retrospective bookkeeping, not past release tags. Dates use America/New_York.

| Version | Date | Brief / request | Major changes |
| --- | --- | --- | --- |
| v0.8 | Original brief; exact date not recorded | [Original master specification](versions/original-v0.8.txt) | Initial five-section prototype; two project stories; editorial typography; day-to-night direction; accessible mobile navigation; inquiry preview. The active copy of this historical brief is also preserved in `master-specification.txt`. |
| v0.9.1 | October 2, 2026 | Owner-supplied broadcast image | Replaced broadcast placeholders on homepage and case study with the supplied production collage and descriptive alt text. |
| v0.9.2 | October 2, 2026 | Owner-supplied second portrait | Replaced the About portrait placeholder with the supplied formal portrait, preserving its full proportions. |
| v0.9.3 | October 2, 2026 | English/Spanish footer switch | Added full page-copy translations, persistent language selection, localized navigation and inquiry labels, and document language updates. Kept entered form values when changing languages. |
| v1.0 | October 2, 2026 | [Polished Design System v1.0](design-system-v1.0.txt) | Finalized homepage narrative; three projects with 001–003 numbering; new EmilioSierra.com case study; distinct web, packaging and broadcast visual vocabularies; refined environmental palette; 12/8/4 alignment grids; 160/260/500/800 ms motion tokens; architectural shapes; larger About portrait; updated English and Spanish text. |

## Current state — v0.9.4, unnumbered labels

On October 2, 2026, Emilio requested undoing the v1.0 update. The site source, images, tests, package files and build configuration were restored from `source-before-v1.0.tar.gz`. The v1.0-only studio preview component was removed.

The restored site has the earlier homepage copy and layout, two case studies, the supplied broadcast collage and About portrait, and the English/Spanish footer switch. Both prompts, the version history and v1.0 previews remain available. The active design instructions now point to the previous brief.

The rolled-back v1.0 source is preserved in [source-v1.0.tar.gz](versions/source-v1.0.tar.gz), with its [validation record](versions/v1.0-validation.md), so that version can be revisited without reconstructing it.

## v0.9.4 — unnumbered labels

October 2, 2026: removed numbered slash labels from homepage sections, projects, services, case-study story sections, the inquiry heading and the not-found heading. Removed numbered mobile-menu items. English and Spanish labels are updated together. Internal service anchors remain stable. The archived prompts and source snapshots retain their original numbering as historical records.

Validation: TypeScript and ESLint checks; no browser suite rerun for this copy and markup refinement.

## v1.0 implementation notes (archived)

- The v1.0 design thesis was near-future Miami through editorial sophistication, technology and human personality. `AGENTS.md` starts with “FAMILIAR UX. UNFAMILIAR PRESENTATION.” and points future changes to the current brief.
- The homepage now follows Storefront → Selected Work → What I Do → Profile → Start Something. The brief's reference times inform the environments without appearing as clocks.
- Selected Work opens with EmilioSierra.com, followed by Vintage Packaging Recreated for the Stage and Behind the Live Broadcast. Existing packaging/broadcast URLs are preserved.
- The site project uses a code-native cobalt composition of the actual studio identity. Packaging uses measurement/assembly cues; broadcasting uses production-channel microtype and a functional red signal. “Live broadcast” describes the project medium; no active stream or viewer count is claimed.
- Cormorant Garamond remains the display voice. Verdana remains the information/interface voice, including service titles and microtype. No additional fonts, stock assets or generated images were introduced.
- Daylight starts in soft white; afternoon is a slightly deeper neutral; services receive subtle environmental warmth; profile moves into cobalt blue hour; contact ends in ink with cobalt illumination.
- The supplied portraits, packaging image and broadcast collage, persistent English/Spanish footer controls, native scrolling, keyboard menu behavior, inquiry-preview honesty and noindex setting carry forward.
- Browser checks now build into `.next-test` and run on port 3100, separately from the development server, so visual records use a consistent production build.
- The inquiry form remains a preview. Publishing, email delivery, permissions/credits, social metadata and manual device/screen-reader checks remain launch work. The new design brief does not resolve those business details.

## Visual record

- [v1.0 desktop](versions/v1.0-desktop.png)
- [v1.0 mobile](versions/v1.0-mobile.png)

These previews show the English homepage with all supplied images loaded.

## Recovery

[Source before v1.0](versions/source-before-v1.0.tar.gz) contains the previous `src`, `public`, tests, package files, build/test configuration and README, including the media and language changes. Extract into a separate directory to inspect or restore the previous implementation without overwriting current work.

## Validation

See [archived v1.0 validation](versions/v1.0-validation.md) for that version’s checks and [current validation notes](validation.md) for restoration checks.

## v0.9.5 — work heading simplified

October 2, 2026: removed the “Selected work” eyebrow above “Ideas, made real.” in both language views, preserving the headline’s desktop and mobile alignment.

## v0.9.6 — work heading spacing

October 2, 2026: reduced top spacing above “Ideas, made real.” by 24 pixels on desktop and mobile.

## v0.9.7 — work label restored

October 2, 2026: restored the unnumbered “Selected work” label above “Ideas, made real.”, with its Spanish translation. Kept the reduced section top spacing.

## v0.9.8 — original work spacing restored

October 2, 2026: removed the work-section padding overrides, restoring the original shared section spacing of 110 pixels on desktop and 75 pixels on mobile. The unnumbered “Selected work” label remains.

## v0.10 — contact email integration prepared

October 2, 2026: replaced the inquiry preview with a server-side Resend connection addressed to emiliomsierra@outlook.com. Added shared validation, pending/success/error states, accessible field errors, English/Spanish messages, visitor reply-to, idempotent retry, honeypot, origin/body checks and per-process limits. Delivery remains disabled until the API key and verified sender are configured. No real emails have been sent during automated testing. Setup is documented in contact-form-setup.md; live inbox verification remains pending.

Contact integration validation: six server tests and four browser tests passed with mocked email delivery, including validation/focus, pending and success states, duplicate prevention, retry identity, Spanish messages and accessibility of validation errors. Production build, TypeScript and ESLint passed. Live Outlook delivery remains unverified until credentials are configured.

## Deployment dependency repair

October 4, 2026: updated `eslint-config-next` from the archived Next.js 14 configuration to `^16.3.7`, matching the active Next.js version and supporting ESLint 9. Regenerated `package-lock.json` to resolve Vercel's dependency-installation conflict without bypassing peer dependency checks. Site design and inquiry behavior are unchanged.

Validation: clean `npm ci`, ESLint and the production build (including TypeScript checks) passed. No deployment performed.

## Production SEO and social-sharing metadata

October 6, 2026: configured the requested homepage SEO title and description, canonical `https://emiliosierra.com`, Open Graph website identity, and Twitter/X large-image card using the Next.js App Router Metadata API. Kept the existing production metadata base and title template for other routes, with an absolute homepage title to avoid an appended suffix. Homepage metadata is scoped to `src/app/page.tsx`; existing case-study and inquiry titles/descriptions are unchanged and do not inherit the homepage canonical or Open Graph URL.

Moved the existing homepage client component unchanged into `src/app/home.tsx` so the server page can export metadata. Added the supplied artwork unchanged at `public/images/emilio-sierra-social.png` (1734 × 907 PNG), referenced by absolute production URL with the approved alt text for both social cards. The image and homepage client component were verified byte-for-byte against their originals. No visible copy, styling, layout, navigation, animations, project content or inquiry behavior changed. Historical prompts remain unchanged.

Removed the prototype's site-wide `noindex, nofollow` metadata and robots.txt crawl prohibition, both of which were still present on the live site and prevented production indexing.

Validation: production build completed without errors or warnings; TypeScript and ESLint passed. Two new metadata browser tests passed, covering unique/exact homepage tags, social metadata, original image delivery from the local production server, crawl permission and preservation of page-specific metadata. Existing accessibility, responsive-layout, mobile-navigation, disabled-inquiry and language tests passed; the language-navigation test timed out once during the combined run and passed on an isolated rerun. The pre-rendered homepage HTML also contains exactly one title, description and canonical, with social metadata available without JavaScript.

Production follow-up: read-only HTTP checks found that `https://emiliosierra.com` currently returns a Vercel 308 redirect to `https://www.emiliosierra.com/`. The hosting domain preference must be aligned with the requested non-www canonical; no hosting settings were changed. The new social image currently returns 404 on the existing deployment. Local production serving is verified, but live metadata/image verification remains pending deployment. No deployment performed.

## Search Console sitemap

October 7, 2026: added `src/app/sitemap.ts` using the Next.js sitemap metadata convention to generate `/sitemap.xml`. Includes the homepage, inquiry page and every case-study URL from the existing project list, so future project entries are included on rebuild. URLs use the previously approved `https://emiliosierra.com` origin. Added the absolute sitemap URL to robots.txt. No modification dates were invented, and no visible content, design or inquiry behavior changed.

Validation: production build (including TypeScript) and ESLint passed. Parsed the generated XML and verified all four public-page URLs, uniqueness and the sitemap declaration in generated robots.txt. No deployment performed. After deployment, submit `https://emiliosierra.com/sitemap.xml` through the property's Sitemaps report in Google Search Console. The previously recorded hosting redirect/domain-alignment follow-up remains relevant.

## Canonical hostname aligned to www

October 7, 2026: at the owner's request, changed the canonical production hostname to `https://www.emiliosierra.com`. Updated the root metadata base, homepage canonical, Open Graph URL, shared Open Graph/Twitter image URL, sitemap URLs and robots.txt sitemap declaration. Updated metadata test expectations and added checks for valid sitemap XML containing only the four canonical www page URLs. Earlier history above records the previous non-www direction and remains unchanged.

The homepage canonical is exactly `https://www.emiliosierra.com/`. Next.js 16.3.7's metadata resolver removes the slash from root canonical URLs even when supplied explicitly. To preserve the requested exact URL without changing routing, the homepage renders one canonical link using React's head-hoisting behavior instead of the `alternates.canonical` field. Other SEO and social metadata continues to use the Metadata API. The generated HTML was checked for exactly one canonical link in the server-rendered head.

No application hostname redirect was added. Vercel settings, existing slash-removal routing, visible content, design and inquiry functionality are unchanged. Production build (including TypeScript) and ESLint passed. Generated sitemap XML contains four unique www URLs; the built routing manifest retains only the existing internal slash-removal redirect.

Existing test validation: all 18 tests passed across the standard suite and an isolated mocked inquiry UI run. Two browser checks timed out in the combined run and passed on isolated rerun with a 60-second timeout (page-specific metadata preservation and representative responsive viewports). All four inquiry UI tests used dummy server credentials and mocked API responses; no real emails were sent. Temporary test-runner configurations and artifacts were kept outside the source tree.

Read-only production checks returned HTTP 200 without redirects for `https://www.emiliosierra.com/`, `/sitemap.xml` and `/robots.txt`. The live sitemap and robots declaration still use non-www URLs from the previous deployment. The www-only sitemap is verified in the updated local production build; live SEO content verification remains pending deployment. No deployment performed.

## Store v1 — local integration audit and architecture proposal

October 13, 2026: inspected the local application environment, environment-file variable names, dependency manifest/lockfile, server/client source and available Vercel linkage. No Stripe/Neon variables, Stripe SDK or database library are locally available. The Vercel integrations reported by the owner could not be inspected remotely from this session; their configuration and sandbox mode remain unverified. No credential values were exposed. A tracked-text commerce credential-pattern scan found no matches, with history and binary archives outside that scan's scope.

Added [Store v1 audit and proposal](versions/store-v1-foundation-2026-10-20.md), covering the recommended official Neon driver with parameterized SQL (without an ORM), guest cart, schema needs, atomic inventory reservations, Stripe retry/reconciliation behavior, test-only server client and webhook boundaries, expected endpoint URLs, and proposed implementation files. Honored the owner's explicit stop before selecting a new database architecture. No SDK, database framework, client, migration, endpoint or commerce UI was implemented; no environment variables were created. Existing public site, contact system, SEO, routes and historical prompts are unchanged. No deployment or payment operation performed.

Validation: production build, ESLint and TypeScript passed. All 18 existing tests passed across the standard run, isolated mocked inquiry UI run, and two focused browser reruns. The initial standard run encountered Chrome network suspension and navigation timeout in two layout checks; both passed independently with one worker and a 60-second timeout. The six inquiry server tests also passed separately. No real emails sent. The build-generated `next-env.d.ts` change was restored to preserve source.

## Store v1 — server and schema foundation

October 14, 2026: after the owner approved the official Neon driver without an ORM and confirmed Vercel's existing Stripe/Neon integrations, proceeded with credential-free local implementation. The approved Stripe resource remains `stripe-sandbox-vercel-test`; no resources or environment variables were created. Local Vercel linkage and exact integration-variable names remain unavailable. Variable-name bindings intentionally remain unset pending those names; no credentials are copied into source.

Installed the official Stripe/Neon server SDKs and `server-only`, plus development-only PGlite for disposable PostgreSQL schema tests. Added lazy server-only clients that reject live Stripe keys and public credential bindings, cart ID/quantity validation, a bound-parameter catalog query, versioned transactional/checksummed SQL migration tooling and `0001_store_foundation.sql`. The namespaced schema defines products, multiple image references, TEST-only orders, immutable-by-catalog purchase snapshots, separate inventory reservations matching order-item quantities, and unique processed-event IDs. This schema is defined/tested locally and **has not been applied to Neon**. Reservation/fulfillment transactions and multi-connection concurrency tests remain required before checkout.

Added the preparatory `/api/stripe/webhook` POST route with bounded raw-body signature verification and test-only events. Valid test events return 503 until durable payment processing exists; no event is falsely acknowledged or used to mark an order paid. No checkout endpoint, Store page or cart UI was added. Existing public pages, navigation, styles, contact behavior, SEO, animations, routes and historical prompts are unchanged. No deployment, real Stripe request/payment, Neon connection or email sent.

Validation: production build, lint and TypeScript passed. All 13 commerce tests passed; all 19 Playwright tests passed across the standard and isolated mocked inquiry UI runs (32 tests total). Initial lint naming and Node-test discovery issues were corrected before the passing runs. Migration listing made no database connection. The build-generated `next-env.d.ts` change was restored. Dependency audit reports seven high-severity findings in unchanged existing Next.js/lint/source-map dependencies, outside the new commerce packages; security maintenance remains a follow-up before checkout activation. See [current Store foundation report](versions/store-v1-foundation-2026-10-20.md) for file lists, configuration requirements and deferred payment safeguards.

Store v1 configuration follow-up: the owner supplied the existing Stripe variable names `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_MCP_KEY`. Bound the server-only Stripe client to `STRIPE_SECRET_KEY`; its test-only guard remains in place. No credential values were supplied or exposed, and no environment variables were created. Publishable/MCP keys are unused. The Neon connection and webhook signing-secret bindings remain unset pending their actual names. Adjusted the absent-configuration test to stay independent of provider credentials in the test process.

Configuration follow-up validation: all 13 commerce tests, lint and the production build (including TypeScript) passed again. No provider requests or deployment; generated `next-env.d.ts` restored.

Neon configuration follow-up: the owner supplied the existing variable names `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Bound the server-only Neon utilities and migration runner to `DATABASE_URL`, without adding duplicate variables or copying connection-string values into source. The unpooled variable is recorded but unused. Remote database connectivity and migration application remain unverified; the signing-secret binding remains unset and checkout/payment processing remain disabled. No public-site changes or deployment.

Neon binding validation: all 13 commerce tests, lint and the production build (including TypeScript) passed. No remote database connection or migration application occurred; generated `next-env.d.ts` restored.

## Restored v0.9.4.2 — Store v1 work reverted

October 20, 2026: at the owner's request, restored the active application and package files to Git commit `ed9258255d868d49f00808410a34c6d50ae7b93c` (`0.9.4.2`). Removed the uncommitted Store v1 server clients, cart/catalog utilities, webhook route, migration scripts/schema, commerce tests and added package dependencies. Public site source already matched that commit and remains unchanged.

The removed Store work is preserved in [the source snapshot](versions/source-store-v1-before-rollback-2026-10-20.tar.gz), with [its foundation report](versions/store-v1-foundation-2026-10-20.md) archived separately. Previous history and historical design prompts remain preserved. No Vercel, Stripe or Neon settings/resources were changed, and no deployment was performed.

Restoration validation: clean `npm ci`, ESLint and the production build (including TypeScript) passed. The first build found stale generated development types for the removed webhook; clearing `.next` and rebuilding resolved it. All 14 enabled tests in the standard suite passed; four inquiry UI tests were skipped by their existing isolated-server requirement. The six inquiry server tests also passed independently, with mocked provider responses and no emails sent. The active source, assets, tests, package files, framework configuration and historical prompts were verified against commit `ed92582`; only archival documentation/history differs. Generated `next-env.d.ts` was restored to the target commit after building.
