---
title: Base Viewer — design
status: draft for John's review
date: 2026-10-28
author: watchbill architect session 8be48108
---

# Base Viewer — design

## Start here

**What this is.** A design, not yet built, for a small Obsidian plugin whose only job is to make a vault's Bases visible: when a vault holds a handful of `.base` files (10 or fewer by default), the plugin lists all of them, and each of their views, in a sidebar panel, so one click opens a board. Written for John, who reviews it, and for whichever agent builds it.

**Terms used below.**
- **Base**: a `.base` file, Obsidian's core Bases feature (a YAML file holding filters and one or more views over the vault's notes).
- **View**: one named layout inside a Base (`1 · STATUS` kanban, `2 · ALL` table). A view is never called a tab; a tab is a herdr or browser tab.
- **Watchbill system**: one of John's agent-run projects (`watchbill systems` lists 32). Each keeps its human-facing state in Markdown records and shows it to John through Bases, chiefly the decision board `dev-docs/decisions/_decisions.base` and the substantive-decisions list `dev-docs/substantive/_substantive.base`.
- **Architect / steward**: the watchbill seats that design a system and run it. Their Bases are where John reads what they are doing and answers their questions.

**Why it exists.** Bases are John's front door to every watchbill system, but Obsidian's file explorer buries them two folders deep (`dev-docs/decisions/_decisions.base`) among hundreds of records, and nothing in Obsidian lists "the boards in this vault". So each time John opens a system's vault he has to dig for the board, or an agent has to hand him a link. The plugin removes the dig.

## What the vaults actually hold (scan, 2026-10-28)

Counted every `.base` file in the 80 vaults registered in `obsidian.json` (skipping `.git`, `.obsidian`, `node_modules`, `.trash`). Observed:

| Shape | Examples | Count |
|---|---|---|
| A watchbill system vault | job-hunt-resume, claude-statusline, windfall, odd-jobs, markdown-unwrap | 2 (`_decisions`, `_substantive`) |
| A system with its own work board | _outreach, privileged-executor, calendar-agent, job-hunt | 3–5 |
| Inflated by noise | claude-plugin-watchbill (11: plugin templates, `Untitled.base`), job-hunt-applications (11: TaskNotes default views, `Untitled.base`), auto-coder (9: copies inside `.worktrees/`), mantisflow (copies inside `.claude/worktrees/`) | 9–11 |
| Large vaults | `~/dev` as one vault (1,103), callimachus-engine (141) | far over any cap |

So the real number of boards per system is 2 to 5, and almost every count above that is noise: git worktree copies, templates, test fixtures, vendored docs and `Untitled*.base` files left from experiments. The filter matters as much as the list.

## What it does

1. **One sidebar panel, "Bases".** Opens in the left sidebar on first load and stays where John puts it, like the file explorer. A ribbon icon and a command (`Base Viewer: show panel`) bring it back.
2. **Lists every Base that passes the filter**, each as a row: a display name (file name without the leading `_` and the `.base`; `_decisions.base` → **decisions**) and, in grey, its folder (`dev-docs/decisions`). Rows sort by folder then name, so a system's boards group naturally.
3. **Each row expands to the Base's views**, read from the file's `views:` list, with the view type as a small icon (kanban, table, cards, list). Clicking the Base opens it on its first view; clicking a view opens the Base on that view.
4. **The cap.** When more than the cap (default 10) Bases pass the filter, the panel lists none of them and says so in one line: "1,103 Bases in this vault, over the limit of 10. Raise the limit or add folders to skip in settings." It never shows an arbitrary first 10, which would hide boards silently. This keeps the `~/dev` umbrella vault from rendering a thousand rows.
5. **Live.** Creating, deleting, renaming or editing a `.base` file updates the panel (vault events, debounced about 300 ms). No polling.
6. **Read only.** The plugin never writes a `.base` file, a note, or anything in `.obsidian` except its own `data.json` settings through Obsidian's `saveData`.

## The filter

A Base is skipped when its path matches any glob in the skip list. Defaults, each traced to a case in the scan:

| Glob | Why |
|---|---|
| `**/.worktrees/**`, `**/.claude/worktrees/**` | git worktree copies duplicate every board (auto-coder, mantisflow) |
| `**/templates/**`, `**/tests/fixtures/**` | plugin templates and test fixtures are not boards (claude-plugin-watchbill, _software-upkeep) |
| `**/vendor/**`, `**/vendor-docs/**`, `**/node_modules/**` | vendored repos (ios-app-manager, _resources) |
| `TaskNotes/Views/**` | TaskNotes' auto-created default views (job-hunt-applications) |
| `**/zArchive/**`, `**/.trash/**` | archived material |
| `**/Untitled*.base` | experiments left unnamed (seven vaults) |

John can edit the list in settings. The cap counts only what passes the filter.

## Settings

| Setting | Default | Note |
|---|---|---|
| Cap | 10 | 0 means no cap |
| Skip globs | the table above | one per line |
| Show views | on | off gives a flat list of Bases |
| Open in | current tab | or a new tab (John's links elsewhere open in a new tab) |
| Reveal panel on vault open | on | |

## How it is built

- **Plain Obsidian plugin**, TypeScript, built with esbuild from the official sample-plugin layout. One `ItemView` registered as the panel, one settings tab, no dependencies beyond `obsidian` and a small glob matcher (`picomatch`, or Obsidian-free hand-rolled matching to keep the bundle tiny).
- **Discovery** is a pure function: `listBases(paths, skipGlobs, cap) → {bases} | {overCap: n}`. It takes `app.vault.getFiles()` filtered to extension `base`, so it sees exactly what Obsidian indexes. Being pure, it is unit-tested against path lists captured from the scan above.
- **Views** come from `parseYaml` (Obsidian's own) on `app.vault.cachedRead(file)`; a Base whose YAML does not parse still lists, with "(views unreadable)".
- **Opening a view**: `app.workspace.openLinkText("<path>#<view name>", "", newTab)`. Obsidian accepts `[[file.base#View]]` links to a Base view; that `openLinkText` with the same subpath selects the view is **Inferred**, not yet tested, and is the first spike (below).
- **Mobile**: `isDesktopOnly: false`, no Node or Electron APIs, so it runs on John's iPad and iPhone vaults too.

## Alternatives considered

- **Obsidian's core Bookmarks.** It can already bookmark a `.base` file, and works today with no code. It is manual per vault, across roughly 30 system vaults and every new one, and an agent may not write `.obsidian/bookmarks.json` on John's behalf (application data rule). It also cannot bookmark a view. Good enough for one vault; not for the fleet.
- **A watchbill-generated home note** (a `_home.md` with links to each board, written by `watchbill systems init`). Cheap and agent-maintained, but it goes stale, is one more file per system, and still has to be found. Worth keeping as a fallback if the plugin is rejected.
- **An existing community plugin.** Not yet searched. Before building, the spike checks the community list for a "Bases in sidebar" plugin; adopting or forking one beats writing a new one.

## How it reaches John's vaults

The plugin lives in this repo and is published on GitHub; vaults install it through BRAT, which the system vaults already carry (`obsidian42-brat` in job-hunt-resume). Getting it into every system vault, existing and new, is a question for the watchbill plugin's architect: the natural place is the vault-setup step `watchbill systems init` already runs. That is a REQUEST to that system through its intake once John approves this design, not something this project does in other repos.

## Open questions for John

1. **"Show up" where?** This design puts the Bases in a sidebar panel. The alternatives are opening each Base as a tab when the vault opens (noisy at 5 boards, and fights the workspace John has arranged), or pinning them at the top of the file explorer (needs patching Obsidian's explorer DOM, fragile across releases). Recommendation: the sidebar panel.
2. **Over the cap: show nothing, or show something?** Recommendation: nothing plus the one-line count, as above. The alternative is to fall back to listing only Bases whose file name starts with `_` (the watchbill convention for boards), which would make the `~/dev` umbrella vault list its 60-odd system boards. Say if you want that.
3. **Name.** The folder is `obsidian-base-viewer`, but the plugin does not view Bases, it lists them; "Bases Panel" (id `bases-panel`) says what it does. Recommendation: rename before the first release, since a plugin id is awkward to change later.
4. **Is this a watchbill system?** It is deterministic software with consumers (every system vault), which fits a software-shaped system: an architect only, no steward, dormant after the gate, intake for requests. Recommendation: yes, registered once the first release ships.

## First build cycle (once approved)

1. **Spike, about one hour.** In a scratch vault: confirm `openLinkText` with `#view` selects the view (else find the API that does); check the community plugin list for prior art; check that `getFiles()` includes `.base` files on mobile.
2. **Build** the panel, filter, cap, settings and live updates.
3. **Gate** (what "done" means): the discovery unit tests pass on the scan's path lists (job-hunt-resume lists 2, claude-plugin-watchbill and job-hunt-applications drop to their real boards, `~/dev` reports over cap); the plugin loads with no console errors in Obsidian 1.15 on the Mac and on the iPad; a screenshot of the panel in two system vaults, looked at, not only measured; clicking a view opens that view.
