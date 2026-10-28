---
title: Base Viewer — questions for John, round 1
date: 2026-10-28
author: watchbill architect session 8be48108
status: awaiting John's answers
---

# Base Viewer — questions for John, round 1

## Start here

These are the questions the architect needs answered before the design in [design.md](design.md) can be finished. Your goal, in your words (2026-10-28): "lower my mental overhead when flipping back and forth between bases to see what architects and stewards are doing on their respective tracking boards." Each question gives its context, then the question, then a recommendation where there is one.

Terms: a **Base** is a `.base` file (Obsidian's core Bases feature); a **view** is one named layout inside it (`1 · STATUS`); a **system** is one watchbill project; a **board** is a Base a system uses to show you its work (its decision board `dev-docs/decisions/_decisions.base`, its substantive-decisions list `dev-docs/substantive/_substantive.base`, and any item board such as outreach's `_drafts.base`).

## 1. Is the flipping inside one vault, or between vaults?

Each watchbill system keeps its boards in its own repo, and each repo is its own Obsidian vault. On the Mac right now 12 vault windows are open (admin-technical, job-hunt-resume, claude-plugin-watchbill, job-hunt-applications, decisions, callimachus-engine, dev, markdown-unwrap, privileged-executor, callimachus, odd-jobs, comparison-shopping-skills). So I suspect most of the overhead is finding the right *window* and then the right Base in it, not only the Base. An Obsidian plugin normally sees only the vault it runs in, so "list the Bases in this vault" and "list the boards across all systems" are two different plugins.

There are three shapes. **(a) A panel in each vault** listing that vault's own Bases. It removes the dig inside a vault, but you still have to pick the window first. **(b) One hub panel**, in one vault, that lists every system's boards from the watchbill registry and, on a click, opens `obsidian://open?vault=<system>&file=<board>`, which brings that system's vault window forward with the board open. This cuts the window hunt as well. **(c) Work inside the `~/dev` umbrella vault**, which already contains most systems, with the panel filtered to system boards. One window, but `~/dev` holds 1,103 Bases and a Base's filters are evaluated against the vault it is opened in, so a system's board opened from `~/dev` may show different records than it does in its home vault (the watchbill docs warn about this for the `~/decisions` vault).

One window holding every board, each showing the right records, is hard for exactly that reason. It is why watchbill's own cross-system vault holds symlinks to the records but no Bases of its own.

**Question:** which is the pain: finding the Base inside a vault, finding the right vault window, or both? **Recommendation:** (b), the hub, with the same code also giving each vault its own small panel (a) for free.

## 2. How does this relate to the `~/decisions` vault and `_boards.md` that watchbill already built?

Watchbill already has a cross-system front door. The `~/decisions` vault symlinks every system's `dev-docs/decisions/` and `dev-docs/substantive/` folders. Its `_queue.base` shows every system's open decision cards in one kanban (**1 · VERDICT**), and a drag there writes the system's own file. Beside it, `_boards.md` is a generated table of each declared item board, with a count of records waiting on you and an `obsidian://` link. Today it lists three (outreach drafts with 13 waiting, upkeep with 2, chat-intake judging with 0). The status line shows the open-decision counts too.

Inside a single vault there are already two shortcuts. Since 2026-10-19 the vault-setup tool (`obsidian-vault-setup`) bookmarks every Base as "Base · <name>" in the Bookmarks pane, and it sets the quick switcher to show all file types, so Cmd+O finds Bases (your words then: "a Base is built to be opened often"). But it does that only on `new`, `open` or `apply`, so a Base created later is not bookmarked until the next run, and it never covers boards in other vaults.

Watchbill decided on 2026-10-20 that item boards stay in their own systems, not in a second shared kanban, because a second drag surface invites a verdict the system's watcher misses. Any design here should respect that: the plugin points to a board and never re-renders it.

**Question:** what does today's setup fail to do for you? For example: `_boards.md` is a note you have to go and open; it lists only declared item boards and not each system's own decision board; or you want to see a system's board as the architect and steward see it, not the merged queue. **Possible answer that changes the project:** if the gap is small, this becomes a sidebar panel in the `~/decisions` vault fed by the data watchbill already writes, and it might be a REQUEST to the watchbill architect rather than a new project.

## 3. When you flip to a board, what are you looking for?

"See what architects and stewards are doing" can mean three different things, and each needs a different design. **A list:** you know which board you want and just want to reach it in one click. **Where the ball is in your court:** you want each row to say how many cards wait on you, so you only open the boards that need you. Watchbill already computes these counts (`~/.local/state/watchbill/decisions-open.json`, and the Awaiting column in `_boards.md`). **What changed:** you want to know which boards moved since you last looked (a card dragged, a new card, a steward's outcome), so you can skip the quiet ones.

The first is the "only job" you described. The second and third would cut far more overhead, but they grow the plugin and couple it to watchbill's records.

**Question:** list only, list with "waiting on you" counts, or also "changed since you looked"? **Recommendation:** list with counts. The counts already exist, so the cost is small, and a count of zero saves a window switch.

## 4. Where should the boards show up?

**Sidebar panel** (the draft): a "Bases" pane in the left sidebar beside the file explorer, always visible, one row per Base with its views underneath. It costs a little sidebar width and stays out of your workspace layout. **Opened as tabs when the vault opens:** every Base opens as its own tab, so they are simply there. Fine at 2, noisy at 5, and it fights whatever tabs you arranged last time. **Pinned at the top of the file explorer:** looks native, but needs patching Obsidian's explorer, which breaks across Obsidian releases. **A hotkey switcher:** a quick-switcher style popup listing only Bases (type two letters, Enter). Zero screen space, but you have to summon it.

**Question:** which, or which two? **Recommendation:** sidebar panel plus the hotkey switcher. They share the same list, so the second costs little.

## 5. What does "less than 10" mean to you?

Scan of all 80 registered vaults on 2026-10-28: a typical system vault has 2 real boards (`_decisions`, `_substantive`), and those with item boards have 3 to 5. Every vault above that is inflated by noise: git worktree copies (auto-coder, mantisflow), plugin templates and `Untitled.base` files (claude-plugin-watchbill, 11), TaskNotes' default views (job-hunt-applications, 11). The umbrella vaults are far over: `~/dev` has 1,103 and callimachus-engine 141. The draft filters out the noise first and then applies the cap.

If 10 is a clutter guard, the remaining choice is what to show over the cap: nothing plus a one-line count (the draft, so no board is silently hidden), the first 10 (simple, but hides boards), or only Bases whose name starts with `_` (the watchbill convention for boards, which would make `~/dev` list its 60-odd system boards).

**Question:** is 10 a real rule or a clutter guard, and what should happen over it? **Recommendation:** clutter guard, configurable; over the cap, fall back to `_`-prefixed boards only, and if that is still over, show the count.

## 6. Open the Base, or a specific view?

Watchbill boards have numbered views (`1 · STATUS` kanban, `2 · ALL` table; the queue's `1 · VERDICT`, `2 · PROPOSED ADRS`, `3 · OPEN`). The draft shows each view as a child row, so you can jump straight to `2 · ALL`. That doubles the rows, and Obsidian already reopens a Base on the view you last used, which may be all you want. Also, I have not yet tested whether a plugin can open a Base on a chosen view (Obsidian's `[[file.base#View]]` link form suggests it can); that is the first spike.

**Question:** one row per Base, or rows per view? **Recommendation:** one row per Base, views shown only when you expand it.

## 7. Mac only, or the iPad too?

The plugin can be built so it runs on Obsidian mobile, and the draft does that. But a hub that lists boards across vaults (question 1, shape b) needs every system's vault present on the device it runs on. On the Mac they are all local; on the iPad only the vaults synced there exist (there is an open admin-technical project on vault sync strategy and LiveSync conversions). A hub on the Mac can also read the watchbill registry from disk; on the iPad it cannot, so it would need that data inside a synced vault.

**Question:** do you flip between boards on the iPad, and if so, natively in Obsidian for iPad or through a Moshi session to the Mac? **Recommendation:** Mac first; iPad as a later cycle, if you use it there.

## 8. Every Base, or only watchbill boards?

Two ways to find what to list. **Scan the vault** for `.base` files and filter out the noise (the draft). That works in any vault, watchbill or not (admin-technical's mcp-servers inventory, `~/writing`'s posts), but the noise filter needs tuning as new noise appears. **Read watchbill's registry** of systems and their declared boards (`watchbill systems`, each system's `owners.yaml` `watch:` list, the decision folders). That gives exactly the boards, with no filter and no cap needed, but only for watchbill systems, and it ties the plugin to watchbill's file formats, which then become a contract.

**Question:** do you also want non-watchbill Bases (inventories, trackers) to show up? **Recommendation:** both, kept separate: the hub reads the registry for system boards, and each per-vault panel scans its own vault.

## 9. Name

The folder is `obsidian-base-viewer`, but the plugin does not render Bases; Obsidian does that. It lists them and opens them. "Bases Panel" (plugin id `bases-panel`), or "Boards" if it ends up watchbill-specific, says what it does. A plugin id is awkward to change once installed in many vaults, so it should be settled before the first release.

**Question:** keep "Base Viewer", or rename? **Recommendation:** rename to fit the answer to question 8: "Bases Panel" if general, "Boards" if watchbill-only.

## 10. Who owns it, and how does it get installed?

This is deterministic software with consumers (every system vault). Under watchbill that makes it a software-shaped system: an architect only, no steward, dormant after its gate, and an intake folder for requests. Alternatively, if question 2 shows it is mostly a view on watchbill's own data, it belongs inside the watchbill plugin's project, and the right move is a REQUEST to that architect.

Installation into roughly 30 system vaults, existing and new, is a separate question. The vaults already carry BRAT, so the plugin can be published on GitHub and added through BRAT. Making it automatic for new systems means watchbill's vault setup (`watchbill systems init`) adds it, which is that system's change to make. A hub needs installing in one vault only.

**Question:** its own watchbill system, or a feature of watchbill? And if a hub, which vault: `~/decisions`, or a new one? **Recommendation:** decide after question 2. If it is a hub in `~/decisions` built on watchbill's data, make it a watchbill feature; if it is a general panel, make it its own small system.
