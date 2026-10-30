---
title: Base Bookmarks — watch
date: 2026-10-28
author: watchbill architect session 8be48108
---

# Base Bookmarks — watch

**Start here.** What the architect of Base Bookmarks (an Obsidian plugin keeping a "Bases" bookmark group in step with each vault's `.base` files) watches after release, how, and when the watch ends. John asked (2026-10-28 17:14): "watch it work for a few hours, wake up tomorrow and watch it work for an hour or two and then shut down."

## What is watched

- **Every vault with the plugin installed** (read-only probe `node tools/probe.mjs --open --problems`): the Bases on disk against the saved "Bases" group, with the plugin's own planning logic. A vault out of step on two checks 5 minutes apart is a signal.
- **The rollout**: the intake note's `processed:` line in `~/dev/obsidian-vault-lifecycle/intake/2026-10-28-base-bookmarks-rollout.md`, and messages from `vault-lifecycle-architect`.
- **GitHub**: CI and release runs; issues on the repo.
- **The iPad (Mel)**, when its tunnel is up: the plugin loads, the group appears, no notice.

## How

A `Monitor` in the architect's session runs the probe every 5 minutes and prints only a vault out of step twice in a row; re-armed every 30 minutes. Green prints nothing.

## Exit

Watch ends after the morning session of 2026-10-29 (one to two hours), with: the iPad check done or recorded as not possible, the vault renamed to `obsidian-plugin-base-bookmarks` (Obsidian's `vault-move`), and this file's log updated. Then the session shuts down; the project is dormant (no steward: deterministic software). Defects and requests after that: an intake note here (`intake/`, to be created with the system's registration) or a GitHub issue.

## Alerts

To John in this session's chat; anything urgent also as a push notification.

## Log

- 2026-10-28 17:40: watch armed; 3 vaults on 0.1.1, all in step.
- 2026-10-28 18:56: claude-plugin-watchbill went from 7 to 8 Bases and its group followed on its own (a Base created by another session, bookmarked live); 3 vaults in step; intake not yet processed; Mel offline.
- 2026-10-29 11:38: the session was idle overnight (the evening and 09:57 checks did not run). Probe: 3 vaults in step; intake still `processed: null`; CI green; no issues. Mel's tunnel up, but Obsidian closed there and no test vault on the iPad: tested under Obsidian's mobile emulation instead (gate row 4). One missed start under emulation, not reproduced; 0.1.2 released with a 5-minute re-check and installed in the 3 vaults.
- 2026-10-29 11:55: watch ended. Open: rollout to every vault and this vault's rename and LiveSync enrolment (with obsidian-vault-lifecycle, intake 2026-10-28-base-bookmarks-rollout); a real-iPad test once a vault with the plugin reaches Mel.
- 2026-10-29: vault-lifecycle-architect took the rollout intake as a card on obsidian-vault-lifecycle's board for John to confirm. It recommends always_on through BRAT, bookmark_bases false, and BRAT left on with updateAtStartup, for every vault except ~/dev (1,156 Bases; held until the plugin caps or filters). On John's yes, that seat lands the change and runs the apply, and will test on Mel before enabling there; it declined our offer to run it.
- 2026-10-29 20:49: rollout landed (obsidian-vault-lifecycle: admin-technical 634929e9, obsidian-vault-setup 0.1.12; John's yes on that system's card). The probe finds 15 vaults on 0.1.2, all in step (~/dev held back). ~/decisions showed out of step only because the probe did not follow symlinks; Obsidian sees 62 Bases there and the group holds 62. Probe fixed. Mel still untested (vault-lifecycle tests there before enabling).
