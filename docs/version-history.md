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
