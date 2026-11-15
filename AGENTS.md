FAMILIAR UX. UNFAMILIAR PRESENTATION.

The active website is restored to the version before Design System v1.0, at the owner’s request. Use docs/master-specification.txt for the current direction, together with the supplied portraits/project images and the English/Spanish footer switch.

Preserve both historical prompts: docs/versions/original-v0.8.txt and docs/design-system-v1.0.txt. Design System v1.0 is archived, not the active direction; do not reapply it unless the owner asks.

Record major changes and reversions in docs/version-history.md. Source snapshots and visual records are in docs/versions. Never rewrite historical prompts to match the current implementation.

Keep truthful inquiry behavior and accessibility. The owner has authorized email delivery to emiliomsierra@outlook.com; only confirm a submission after the provider accepts it, and keep sending unavailable until server credentials are configured. Do not invent project facts, live status or contact details. Do not deploy unless asked.

Visible navigation, section, project, service and inquiry labels are unnumbered at the owner’s request. Do not add numbered slash prefixes or numbered menu lists. Internal anchor IDs can retain their stable identifiers.

Stories publish to the blog by default. Project and professional stories use `/blog/work/[slug]` and the `work` category; agree on other categories with the owner before adding them. Register stories in `src/content/blog.ts`; homepage features are selected independently by `homepageFeaturedSlugs` and must never grow automatically when a story is published. Preserve the permanent redirects from `/work/[slug]`. Main, mobile and footer navigation use Blog, linking to `/blog`.

Owner-approved URL exception: the Lucky Bird work story uses `/blog/luckybird/luckysfeatherfundraiser` (keep this exact spelling). Its former `/blog/work/lucky-birds-feather-fund` URL redirects permanently there. Its editorial category remains work; this custom URL does not create a new category.

Lucky's dedicated page is `/luckybird`, with first navigation link “Lucky Bird's Feather Fundraiser!”. Maintain real photo/update content in `src/content/luckybird.ts`; never fabricate photos, reviews or fundraising totals. Reuse the existing Stripe product/price. See `docs/luckybird-setup.md` before checkout, schema or moderation work. Keep test/live credentials and databases separate, the pipeline schema read-only, and schema application explicit. Community submissions stay private until approved. Only verified Stripe payment state can confirm a purchase; a return URL cannot. No deployment is authorized by this implementation request.

The owner removed the standalone Lucky Bird homepage section; keep the navigation button as the homepage entry point. Redirect the former `/blog/luckbird/` story URLs to `/blog/luckybird/`.
