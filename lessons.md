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

### 2026-08-12 — Backticks in `git commit -m "..."` execute as real shell commands
**Context:** Wrote a commit message narrating a build-flakiness investigation, quoting troubleshooting output like `` `next build` `` and `` `<Html> should not be imported...` `` inside a double-quoted `-m` string.
**Mistake/Insight:** Bash performs command substitution on backticks *before* `git commit` ever sees the string — this ran `next` and `<Html>...` as real commands, and one literal `` `git stash` `` in the narrative silently executed a real `git stash`, discarding in-progress uncommitted work. Caught via `git status --short` showing a missing file and `git stash list` showing an unexpected entry; recovered via `git stash pop`.
**Rule:** Any commit message containing backticks or other shell-special characters goes to a temp file first, committed via `git commit -F <file>` — never `-m` with raw quoting of code/error text.

### 2026-08-12 — pnpm can silently break every install with a placeholder `allowBuilds` value
**Context:** `pnpm-workspace.yaml`'s `allowBuilds` map had `'@parcel/watcher': set this to true or false` — a literal placeholder string pnpm itself had auto-written on an earlier install when it encountered a new package with an install script, expecting the user to fill in `true`/`false`.
**Mistake/Insight:** Left unfixed, every subsequent `pnpm install` (and anything that triggers one internally, like `turbo typecheck`'s dep-status check) exits 1 with `[ERR_PNPM_IGNORED_BUILDS]` — easy to misread as an unrelated dependency/build failure.
**Rule:** After any `pnpm install` that reports "Ignored build scripts" or edits `allowBuilds`, immediately open `pnpm-workspace.yaml` and confirm every `allowBuilds` value is an actual `true`/`false`, not pnpm's placeholder text.

### 2026-08-12 — Verify the actual asset, not the search result, before using "free" stock media
**Context:** Sourcing royalty-free photos/music for the homepage preview (couple photos, background tracks) from Unsplash/Pexels/Wikimedia search results.
**Insight:** Caught two bad candidates purely by checking the real resolved page/CDN URL and license text before download: one Unsplash search result actually resolved to `plus.unsplash.com` (paid Unsplash+, not free), and one Wikimedia "instrumental" track was actually a 1930s German military march per its own description — completely wrong for a wedding context despite a plausible-sounding filename.
**Rule:** For any "free"/"royalty-free" asset, always (1) resolve the actual CDN URL, (2) read the license text on the source page itself, (3) for photos, visually confirm the content, (4) for audio/text, read the actual description — never trust a search snippet or filename alone. This project will keep needing free stock assets (more templates, more preset tracks), so this check is a recurring task, not a one-off.

---

## Anti-Patterns to Avoid (Project-Specific)

- **Don't** mark a milestone done without integration testing — unit tests can pass while user flows are broken.
- **Don't** hardcode any UI string — always use i18n keys, even in MVP.
- **Don't** trust user-uploaded files by extension — always magic-byte sniff and re-encode.
- **Don't** put `tenant_id` filtering only in middleware — DB-level RLS is mandatory defense in depth.
- **Don't** add a new third-party service without an adapter + fallback.
- **Don't** start an AI generation task without a cost cap per tenant per day.
