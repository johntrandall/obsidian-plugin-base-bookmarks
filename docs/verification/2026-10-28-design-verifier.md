---
title: Cold verification of design.md revision 3
date: 2026-10-28
verifier: watchbill:verifier subagent "design-verifier", spawned by session 8be48108
subject: docs/design.md at commit 956de14 (revision 3, before the build)
outcome: what became of each finding is in docs/design.md, section "Verification (2026-10-28)"
---

# Cold verification of design.md revision 3 (verbatim report)

VERIFICATION REPORT — docs/design.md (rev 3). I wrote nothing; reads + read-only `obsidian eval` on obsidian-base-viewer only.

VERDICT: NOT READY TO BUILD AS WRITTEN — one factual error in what John sees (titles, FAIL 2b / MAJOR 1), one bookmark-wiping gap (removal during LiveSync, CONCERN 3a), one wrong count in the skip-list/gate (FAIL 1a).

1. INTERNAL CONSISTENCY
- FAIL 1a — claude-plugin-watchbill count. Design: "every watchbill system vault … gets 2 to 5 bookmarks"; gate: "only their real boards". Vault has 11 .base files; skip list removes 3 under plugin/skills/.../templates/ + root Untitled.base → 7 remain. Not covered: dev-docs/runs/2026-10-23-cards-revise/panel-prototype/_systems.base and dev-docs/runs/2026-10-24-card-grouping/probes/{probe-b,probe-c,2026-10-23-a}.base. Add `**/runs/**` (or similar) or fix the gate.
- PASS 1b — job-hunt-resume: 2 (claim holds). job-hunt-applications: 9 → skip Untitled.base + 7 TaskNotes/Views → 3.
- CONCERN 1c — `**/Untitled*.base` must match a ROOT-level file (Untitled.base is at root in claude-plugin-watchbill and job-hunt-applications); the hand-written matcher needs `**/` to match zero dirs — unit-test it.
- CONCERN 1d — D11 asks BRAT updateAtStartup; manifest has obsidian42-brat as trialed-disabled, roster false, not in always_on. Rollout step 3 doesn't say how vault-setup will enable that setting.
- PASS 1e — What-it-does / How-built / Rollout / Gate agree with D1–D11 (D4 names creation only; design adds rename+delete, fine).

2. FACTS CHECKED
- PASS — obsidian-plugins.yaml: top-level `bookmark_bases: true` (line 36), `always_on` (line 54), track-changes `install: brat` (line 167). Vault-setup README + bin/obsidian-vault-setup document bookmark_bases.
- PASS — obsidian.d.ts 1.13.1 (~/dev/obsidian-track-changes/node_modules/obsidian): vault create/rename/delete; doc says create fires for every existing file at load and to register inside `workspace.onLayoutReady`. `isDesktopOnly` exists.
- PASS — Bookmarks instance has `addItem(item, groupObject)`, `removeItem(item)`, `getBookmarks`. addItem takes the group OBJECT, not a name; items need `ctime`.
- FAIL 2b — Title claim (What it does #5): `getItemTitle` for untitled file → `getShortName()` = `extension==="md" ? basename : name`. A .base bookmark shows `_decisions.base`, not `_decisions`.
- CONCERN 2c — vault-setup's `base_title()` disambiguates same-name Bases ("Verified need: watchbill vault, 2026-10-19"). D6 drops titles → identical `_decisions.base` rows in any multi-system/multi-copy vault.
- Built-in Obsidian behaviour useful to the builder: `onFileRename` already rewrites bookmark paths (no rename handling needed for existing bookmarks); no delete handler (deleted-file bookmarks dangle); `onExternalSettingsChange` reloads bookmarks.json from disk (how a synced file reaches the running app); addItem/removeItem each trigger a save (debounced onItemsChanged) — batch bulk ops.
- Leftover test residue: /Users/johnrandall/dev/obsidian-base-viewer/.obsidian/bookmarks.json still has group "TEST Bases" with TEST-bm2.base (file gone). Your side should clean it. It also confirms delete leaves dangling bookmarks.

3. GAPS (most important first)
- 3a — Removal during partial LiveSync: on the iPad, onLayoutReady can run before LiveSync delivers all files; step 1 "removes bookmarks for Bases that no longer exist" → removes not-yet-arrived Bases, and Customisation Sync carries the removal to the Mac. Guard: remove only on an actual `delete` event, or after a settle delay / LiveSync idle.
- 3b — Duplicates across devices: if both start before first sync, each creates a "Bases" group and may add the same path (each with its own ctime). plan() is specified as add/remove only; it needs: find group by title, merge duplicate groups, dedupe by path, be idempotent so devices converge.
- 3c — John's own bookmarks: a Base he removes from the group is re-added each open; "sorted by path" fights manual order; if he renames the group, a new one is created; a Base he bookmarked himself outside the group appears twice. Say which is accepted.
- 3d — First-run migration: the match rule for vault-setup's "Base · <name>" is unspecified — suggest type file + .base path + title startsWith "Base · ". Say what happens to titles John customised.
- 3e — Uninstall/disable: bookmarks remain (fine) — say so. always_on re-enables it on the next vault-setup apply.
- 3f — Bookmarks core plugin disabled: design covers only missing methods; decide enable vs. no-op.
- 3g — Scale: hundreds of Bases fine performance-wise if the rebuild batches writes. Obsidian's own Excluded files (userIgnoreFilters, which vault-setup already sets) are not honoured by the skip list.
- 3h — BRAT update-at-startup: a bad release reaches every vault including the iPad, and an update takes effect only after the next restart; the release gate is the only guard. Consider pinning/staging.
- 3i — Undocumented Bookmarks API: well mitigated (feature-check + notice + README table).

4. MAJOR FOR JOHN
- MAJOR 1 — Titles: D6 was decided believing the pane shows the file's name; it actually shows `_decisions.base`, repeated and indistinguishable across systems, and he loses the "Base · <name>" titles he set on 2026-10-19. He should confirm or restore disambiguating titles.
- Flag 2 — His curation: he can't remove or reorder Bases inside the group (the plugin re-adds and re-sorts). That changes what he can do in the pane.
- Everything else (skip-list count, duplicate-group handling, sync-safe removal guard, first-run match rule) is a builder detail.

Files read: /Users/johnrandall/dev/obsidian-base-viewer/docs/design.md; ~/admin-technical/inventories/obsidian-plugins.yaml; ~/dev/obsidian-vault-setup (README, bin/obsidian-vault-setup); ~/dev/obsidian-track-changes/node_modules/obsidian/obsidian.d.ts.
