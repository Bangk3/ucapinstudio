# Lessons Learned

> Pattern captured after corrections, mistakes, or non-obvious discoveries.
> Reviewed at session start. Each entry should prevent a future mistake.

---

## Format

Each lesson follows:

```
### YYYY-MM-DD — Short title
**Context:** What was the situation?
**Mistake/Insight:** What went wrong or got revealed?
**Rule:** What I'll do differently from now on.
```

---

## Lessons

### 2026-05-12 — Baileys is a legal/ToS landmine for B2B
**Context:** Initial fitur list included Baileys for WhatsApp broadcast.
**Insight:** Baileys is unofficial WhatsApp Web reverse-engineering. Meta's ML ban detection has gotten aggressive in 2025-2026. For a B2B/WO product, bundling this by default exposes users to losing their business WhatsApp numbers.
**Rule:** For any messaging or third-party integration, always research:
  1. Is the integration officially supported by the vendor?
  2. What's the ToS risk?
  3. Who bears the risk — us or the user?
  Use adapter pattern + officially supported defaults; community plugins for risky options with clear disclaimers.

### 2026-05-12 — Open source wedding invitation space already has many "fork-and-customize" repos
**Context:** Surveyed 10+ GitHub repos for prior art.
**Insight:** Almost none are multi-tenant platforms. All are single-use templates. This is a real differentiation opportunity, not a saturated space.
**Rule:** Before assuming a space is saturated, distinguish *templates* from *platforms*. Open source wedding-tech ≠ open source wedding-invitation-SaaS-platform.

---

## Anti-Patterns to Avoid (Project-Specific)

- **Don't** mark a milestone done without integration testing — unit tests can pass while user flows are broken.
- **Don't** hardcode any UI string — always use i18n keys, even in MVP.
- **Don't** trust user-uploaded files by extension — always magic-byte sniff and re-encode.
- **Don't** put `tenant_id` filtering only in middleware — DB-level RLS is mandatory defense in depth.
- **Don't** add a new third-party service without an adapter + fallback.
- **Don't** start an AI generation task without a cost cap per tenant per day.
