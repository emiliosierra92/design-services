# Emilio Sierra — Creative Technology Studio

Pre-final website prototype based on the owner’s v0.8 specification. Built with Next.js App Router, React, strict TypeScript and native CSS. Display typography uses locally bundled Cormorant Garamond (400/500); interface typography uses Verdana.

## Local development

Use Node.js 22.13+ or a newer supported LTS (one lint dependency requires 22.13+). The current Node 22.12 installation passes build, lint and type checks but reports that dependency engine warning.

```sh
npm ci
npm run dev
```

Visit http://localhost:3000.

```sh
npm run lint
npm run build
npm run typecheck
npm run test:e2e
```

## Structure

- `src/app/page.tsx`: five-section homepage.
- `src/app/blog/page.tsx`: blog index with clickable work-story cards.
- `src/app/blog/work/[slug]/page.tsx`: statically generated work stories.
- `src/content/blog.ts`: blog registry and explicit homepage featured selection; new stories stay off the homepage by default.
- `src/app/start-a-project/page.tsx`: inquiry form with runtime delivery availability.
- `src/app/api/inquiry/route.ts`: validated server-side email submission.
- `src/content/studio.ts`: provisional service and project content.
- `src/components`: navigation, footer, inquiry form and explicit media placeholders.
- `src/app/globals.css`: responsive compositions, semantic tokens and reduced-motion support.
- `docs/master-specification.txt`: original brief preserved verbatim, including every unresolved owner action.
- `docs/launch-checklist.md`: implementation boundaries and launch work.

## Current boundaries

This is a design prototype, not a production handoff. Media is explicitly labeled as placeholder artwork. No stock imagery or generated portraits stand in for Emilio or his work. Copy and service capability labels remain provisional. The placeholder ES favicon also needs owner review.

The contact form has a server-side Resend connection addressed to emiliomsierra@outlook.com. It remains unavailable until `RESEND_API_KEY` and `INQUIRY_FROM_EMAIL` are configured; no live delivery has been verified. See [contact form setup](docs/contact-form-setup.md) and `.env.example`. The form validates on client and server, supports accessible status/error handling and sends the visitor’s address as reply-to. No inquiry database, analytics or third-party embeds are configured.

Robots metadata and `/robots.txt` prevent indexing by cooperative search engines while content is unapproved. This does not restrict access; use deployment access protection if sharing a preview privately. Sitemap, canonical/OG metadata and approved social imagery should be finalized as part of launch preparation.

## Deployment

The repository is compatible with a standard Vercel Next.js project. Nothing has been deployed. Complete the launch checklist before enabling public indexing or accepting inquiries.

Browser tests use installed Google Chrome and start the production server. Run `npm run build` first. They cover routes, automated accessibility, layout overflow, mobile menu focus and honest inquiry preview behavior.

## Version history

The site was restored to its pre-v1.0 version at the owner’s request. Both prompts, version notes, v1.0 previews and source snapshots are preserved in [docs/version-history.md](docs/version-history.md).

## Publishing stories

Add project/professional stories to the `work` registry in `src/content/blog.ts` (existing case studies use `src/content/studio.ts`). Each entry receives `/blog/work/<slug>`, a card on `/blog`, metadata and sitemap inclusion. Do not add new categories without the owner's agreement. Homepage features are separately selected by `homepageFeaturedSlugs`; publishing a story does not feature it automatically. Add Spanish translations in `src/content/spanish.ts` or `src/content/blog-spanish.ts`. Do not invent publication dates or project status.

For a new editorial work story, create content matching `EditorialWorkStory` and add it to `editorialWorkStories`. Both the route and the index use that registry. Keep the English source complete and add its Spanish strings; optional project-status notices describe plans without implying features are available.

Legacy `/work/<slug>` URLs permanently redirect to `/blog/work/<slug>`. The Lucky Bird article preserves owner-supplied copy and links to the dedicated `/luckybird` page. Checkout and community availability are checked at runtime.

The owner-approved Lucky Bird story URL is `/blog/luckybird/luckysfeatherfundraiser`. Its content sets an explicit `path`; the blog card and sitemap resolve it through the shared path helper. Its former `/blog/work/lucky-birds-feather-fund` and `/work/lucky-birds-feather-fund` URLs redirect directly to that canonical location. It remains a work story, with the same content and homepage selection.

## Lucky Bird

The homepage navigation button leads to `/luckybird`; there is no separate Lucky Bird homepage section. Real photos and updates belong in `src/content/luckybird.ts`; empty collections show honest placeholders. The page includes the existing $10 feather product, care resources and a moderated on-site community. No invented reviews or totals are included.

Read [Lucky Bird setup and operations](docs/luckybird-setup.md) for environment names, test/live separation, explicit schema initialization, webhook registration, moderation and the remaining payment/refund checks. The existing live product is reused; no product is created. Purchasing and submissions remain unavailable without their server configuration. `npm run test:luckybird` runs isolated commerce tests; `npm run luckybird -- help` lists operator commands. No deployment or real payment has been performed for this update.
