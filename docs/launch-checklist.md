# Launch checklist

The site has been restored to the pre-v1.0 version. The active design direction and launch requirements are in `master-specification.txt`; `design-system-v1.0.txt` is preserved as an archived alternative. Version notes are in `version-history.md`. Original EMILIO ACTION REQUIRED markers remain in the preserved brief; the updates below record progress without rewriting that history.

## Owner content and decisions

- Hero and About portraits are supplied and integrated; review their final presentation for launch.
- Homepage copy and layout are restored to the pre-v1.0 version. Confirm the About narrative, service copy and case-study factual details; the unconfirmed age is still omitted.
- Confirm service descriptions, scope and capability labels.
- Prop artwork/assembly guide is integrated. Confirm reproduction rights, any additional finished-prop photography and collaborator/production credits.
- Broadcast collage is supplied and integrated. Confirm permissions, organization names, role and dates before publication; additional footage remains optional future content.
- Resend email delivery is implemented for emiliomsierra@outlook.com. Configure the private API key and verified sender, then verify actual inbox delivery and reply-to; see contact-form-setup.md.
- Decide public email, analytics, professional links and applicable privacy/business details.
- Approve favicon and social sharing artwork.

## Engineering before production

- Supplied media uses responsive Next.js images. Review final phone/desktop composition and performance; preserve source originals.
- Server submission, shared validation, service selection, field errors, normalization, request limits, honeypot, per-process rate limits, provider idempotency, pending/accepted/error states and focus handling are implemented. Add shared or hosting-platform rate limits for a multi-instance deployment and test actual configured email delivery.
- Document provider-specific environment variable names after selection; never commit secret values or expose the recipient in client code.
- Review actual data practices and write appropriate privacy disclosures.
- Complete page canonical URLs, social metadata/image, sitemap and truthful structured data. Remove noindex only after content and permission approval.
- Test actual email delivery, failure paths, spam handling and reply-to configuration.
- Verify final assets, keyboard navigation and screen-reader reading order; test Safari/iOS, Firefox, Edge and Chrome.
- Measure production Core Web Vitals with real media and representative devices. Prototype build success is not proof of performance targets.
- Deploy only when explicitly requested.
