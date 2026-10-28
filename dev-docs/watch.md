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
