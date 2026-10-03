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
- `src/app/work/[project]/page.tsx`: statically generated project stories.
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
