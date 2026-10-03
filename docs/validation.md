# Pre-v1.0 restoration and unnumbered-label validation

Restored October 2, 2026 (America/New_York), at the owner’s request.

- At restoration, source, images, tests, package files and build/test configuration matched the saved pre-v1.0 snapshot byte for byte. The subsequent v0.9.4 refinement removes visible numbered labels in both languages. The README has an added link to the preserved version history; macOS archive metadata is excluded from comparison.
- The v1.0-only studio preview component is removed. The homepage again shows two case studies and the earlier copy and layout.
- The supplied broadcast collage and About portrait and the English/Spanish footer switch are preserved.
- The generated v1.0 test build was removed; active design instructions point to the earlier brief.
- TypeScript and ESLint checks pass after restoration.

The original prompts, v1.0 source archive, previews and validation record remain in docs/versions and docs/design-system-v1.0.txt. See version-history.md for the rollback entry. Browser tests were not rerun during this restoration; the restored implementation previously passed its six browser checks.

## Contact email integration

October 2, 2026: production build, TypeScript, ESLint, six server tests and four browser tests pass. Email-provider responses were mocked; no real emails were sent. Browser checks used an isolated production server with dummy credentials. Live inbox delivery, reply-to, and hosting configuration remain pending. See contact-form-setup.md.
