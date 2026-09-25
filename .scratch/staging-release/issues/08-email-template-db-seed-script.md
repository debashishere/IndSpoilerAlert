# 08: Email Builder — B2B Email Template Seed Script (BE-06)

**What to build:** Create an automated database seed script (`npm run seed:templates`) to pre-populate MongoDB with baseline B2B email templates upon initial staging boot.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Write seed script `seedTemplates.ts` and add script command `npm run seed:templates` to backend `package.json`.
- [x] Seed MongoDB template collection with standard B2B transaction and deal notification templates.
- [x] Verify `TemplateGallery.tsx` loads seeded templates from the API instead of client fallback presets.
