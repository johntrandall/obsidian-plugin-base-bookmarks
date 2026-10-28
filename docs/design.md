---
title: Base Viewer — design
status: draft for John's review (revision 2)
date: 2026-10-28
author: watchbill architect session 8be48108
owner: John Randall
---

# Base Viewer — design

## Start here

**What this is.** The design, not yet built, of a small Obsidian plugin with one job: an always-visible sidebar panel that lists the Bases in the vault you are in, so one click opens any of them. Written for John, who owns the project and approves this design before anything is built, and for the agent that builds it. Revision 2 folds in John's answers of 2026-10-28 to [questions-round-1.md](questions-round-1.md).

**Terms.**
- **Base**: a `.base` file, Obsidian's core Bases feature: a YAML file holding filters and one or more views over the vault's notes.
- **View**: one named layout inside a Base (`1 · STATUS` kanban, `2 · ALL` table). A view is never called a tab; a tab is a herdr or browser tab.
- **Watchbill**: John's system of agent-run projects. Each project ("system") shows John its work through Bases: an **architecture board** (the architect's decisions, `dev-docs/decisions/_decisions.base`, with `dev-docs/substantive/_substantive.base` beside it) and, in many systems, an **operations board** at the vault root where the steward's work items move (outreach's `_drafts.base`, upstream's `_contributions.base`, software-upkeep's `_upkeep.base`, mcp-readiness's `operations.base`).
- **BRAT**: the community plugin that installs plugins straight from a GitHub repo, before (or instead of) the community directory.
- **LiveSync**: the self-hosted sync plugin that carries John's vaults between the Mac (SusanBones) and the iPad (Mel).

**Why it exists.** John flips between Bases to see what each system's architect and steward are doing. Obsidian's file explorer buries the Bases two folders deep among hundreds of records, and nothing in Obsidian lists "the Bases in this vault". John, 2026-10-28: "The pain is finding the base inside a vault … we want to be able to get to just the bases quickly."

## Decided (John, 2026-10-28, in chat)

| # | Decision | John's words |
|---|---|---|
| D1 | Scope is one vault: the plugin lists the Bases of the vault it runs in. | "For now the flipping is inside one vault." "Let's keep this to be just within a single vault … Let that be the focus of this project." |
| D2 | A hub across vaults (for example in the `~/decisions` vault) is a later idea, out of scope here. | "A hub panel in the decisions vault might actually be a good thing." |
| D3 | The Bases live in an always-visible sidebar panel. | "The sidebar panel, which is always visible, that's where the bases should be." |
| D4 | Over 10 Bases: show the architecture board and the main operations board, plus a message that there are more. | "If we do it can just show the architecture one and the main operations one and then show an error message, you know, more than 10 … here." |
| D5 | A click opens the Base on its default or last-used view; no rows per view. | "It should open the base to its default view or to the last used view, I guess." |
| D6 | Runs on the Mac and the iPad. | "It needs to run on Mac as well as iPad." |
| D7 | Independent of watchbill; watchbill is the use case, not a dependency. | "This plugin should be independent of Watchbill, but my use case is Watchbill." |
| D8 | Its own software project, owned by John, shipped as an Obsidian plugin through BRAT, and added as a default plugin to every vault by the vault setup and LiveSync installer. | "This should definitely be its own software project." "I own it. It's an Obsidian plugin. It gets installed … probably with BRAT and the Obsidian LiveSync plugin installer setup should add it as a default plugin on all of our vaults." |

## What it does

1. **A "Bases" panel in the left sidebar**, opened on first load and kept wherever John drags it, like the file explorer. A ribbon icon and the command `Base Viewer: show panel` bring it back if closed. On the iPad the left sidebar is a drawer; the panel sits in it beside the file explorer.
2. **One row per Base**: a display name (the file name without a leading `_` and without `.base`, so `_decisions.base` reads **decisions**) and, in grey beneath, its folder (`dev-docs/decisions`). Pinned Bases (below) come first, then the rest sorted by folder and name, so a system's boards group together.
3. **A click opens the Base** in the current tab (Cmd-click or middle-click: a new tab) with Obsidian's own file opening, so Obsidian shows its default or last-used view (D5). The row of the Base already open is highlighted.
4. **The cap (D4).** When more than 10 Bases pass the filter, the panel lists only the **pinned** Bases (the architecture and operations boards) and, under them, one line: "14 more Bases in this vault (over the limit of 10)." It never shows an arbitrary first 10.
5. **Live.** Creating, deleting, renaming or moving a `.base` file updates the panel within about half a second (vault events, debounced). No polling.
6. **Read only.** The plugin writes nothing but its own settings, through Obsidian's `saveData`.

## Pinned Bases: the architecture and operations boards

D4 needs the plugin to know which Bases are "the architecture one and the main operations one" without depending on watchbill (D7). It does so with a **pinned list** of path patterns in its settings. A Base matching a pattern is always listed first, under the cap or over it. The defaults describe watchbill's layout, as plain patterns any vault can change:

| Default pattern | Matches | Seen in |
|---|---|---|
| `dev-docs/decisions/_decisions.base` | the architecture board | every watchbill system |
| `dev-docs/substantive/_substantive.base` | the decisions waiting on John, beside it | every watchbill system |
| `*.base` at the vault root, not `Untitled*` | the operations board | outreach, upstream, software-upkeep, mcp-readiness, events, writing, decisions |

A vault with no match simply has no pinned Bases. The patterns are ordinary settings, so a non-watchbill vault sets its own, and an agent can set them through the plugin's own settings call (the sanctioned route `obsidian-vault-setup` already uses), never by writing `data.json` by hand.

## The noise filter

Most vaults over a handful of Bases are inflated by copies and leftovers, not boards (scan of all 80 registered vaults, 2026-10-28). A Base whose path matches a skip pattern is not listed and does not count toward the cap. Defaults, each traced to a vault where the scan found it:

| Skip pattern | Why |
|---|---|
| `**/.worktrees/**`, `**/.claude/worktrees/**` | git worktree copies duplicate every board (auto-coder, mantisflow) |
| `**/templates/**`, `**/tests/fixtures/**` | templates and test fixtures (claude-plugin-watchbill, software-upkeep) |
| `**/vendor/**`, `**/vendor-docs/**`, `**/node_modules/**` | vendored repos (ios-app-manager, _resources) |
| `TaskNotes/Views/**` | TaskNotes' auto-created default views (job-hunt-applications) |
| `**/zArchive/**`, `**/archive/**` | archived material |
| `**/Untitled*.base` | unnamed experiments (seven vaults) |

With these, every watchbill system vault in the scan lists 2 to 5 Bases, under the cap. The cap message is for vaults such as the `~/dev` umbrella (1,103 Bases) and callimachus-engine (141).

## Settings

| Setting | Default |
|---|---|
| Cap | 10 (0 means no cap) |
| Pinned patterns | the three above |
| Skip patterns | the table above |
| Open the panel when the vault opens | on |

Settings are per vault, in the plugin's own `data.json`. LiveSync's Customisation Sync carries them between the Mac and the iPad with the plugin.

## How it is built

- **A plain Obsidian plugin** in TypeScript, from the official sample-plugin layout, built with esbuild into one `main.js`. One `ItemView` for the panel, one settings tab. No runtime dependencies beyond `obsidian`; the few glob forms above are matched by a small hand-written matcher, which keeps the bundle small and avoids Node APIs.
- **Discovery is one pure function**, `listBases(paths, settings) → { pinned, rest, hiddenCount }`, fed by `app.vault.getFiles()` filtered to the `base` extension, so it sees exactly what Obsidian indexes. Being pure, it is unit-tested (vitest) against path lists captured from the scan: real vaults, not invented ones.
- **Opening** is `app.workspace.getLeaf(newTab).openFile(file)`. Obsidian then restores the Base's last view itself (D5); the plugin never passes a view.
- **Mobile (D6)**: `isDesktopOnly: false` in the manifest, and no `fs`, `path`, Electron or Node call anywhere. Tested on Mel, not only assumed.
- **Repo**: this folder, `~/dev/obsidian-base-viewer`, published as a public GitHub repo under `johntrandall` with a release per version (`manifest.json`, `main.js`, `styles.css` as release assets), which is what BRAT installs from. On-prem Forgejo mirror as for John's other repos.

## Rollout (D8)

1. **First vault**: this one, by BRAT, then two watchbill system vaults John uses daily, on the Mac and on Mel.
2. **Every vault**: add the plugin to the plugin manifest (`~/admin-technical/inventories/obsidian-plugins.yaml`) as `source: github`, `install: brat`, in the `always_on` list, so `obsidian-vault-setup` installs and switches it on in every new vault and in every existing one on its next `apply`. Vaults on LiveSync carry it to the iPad by Customisation Sync, which the iPad enrolment already applies. The manifest is John's infrastructure, so that change is made there, after this plugin's first release passes its gate, with John's yes.
3. **Overlap to remove**: since 2026-10-19 `obsidian-vault-setup` bookmarks every Base ("Base · <name>") in each vault's Bookmarks pane. Once this plugin is in every vault the bookmarks duplicate it and go stale (a Base created later is never bookmarked). Proposal: switch `bookmark_bases` off in the manifest at the same time, and leave existing bookmarks alone. John's call.

## Later (not this project's first release)

- **Hub panel** in the `~/decisions` vault listing every system's boards across vaults (D2).
- **Counts** of cards waiting on John beside each row (question 3 of round 1; not taken up, since D1 asks for "just the bases quickly").

## Open questions for John

1. **Is the vault-root rule right for "the main operations one"?** It picks every root-level Base. That fits each system in the scan, where the root Base is the operations board. A system that later puts two Bases at its root shows both pinned. The alternative is a name rule (`_*.base` at the root), which would miss mcp-readiness's `operations.base`. Recommendation: the root rule.
2. **"Not going to live in dev."** I read this as: not part of watchbill and not inside the `~/decisions` vault, so the repo stays at `~/dev/obsidian-base-viewer` like John's other software. Say if you meant a different home.
3. **Name.** It lists and opens Bases; Obsidian views them. "Bases Panel" (id `bases-panel`) says what it does; a plugin id is awkward to change once installed in every vault. Recommendation: rename before the first release. Keep "Base Viewer" if you prefer it.
4. **The bookmarks overlap** (rollout step 3): switch `bookmark_bases` off once this ships?

## First build cycle (after John approves this design)

1. **Spike** (about an hour, in this vault): confirm `getFiles()` lists `.base` files on Mel; confirm `openFile` restores the last-used view; check the community plugin list for an existing plugin that does this (adopt or fork it if one exists).
2. **Build** the panel, filter, pins, cap, settings and live updates.
3. **Gate**, what "done" means, each with evidence: the `listBases` unit tests pass on the scan's path lists (job-hunt-resume lists 2; claude-plugin-watchbill and job-hunt-applications drop to their real boards; `~/dev` shows only its pins and the "more" line); the plugin loads with no console errors on the Mac (Obsidian 1.15) and on Mel; a screenshot of the panel in two system vaults on each device, looked at, not only measured; a click opens the Base on its last view; creating and deleting a Base updates the panel live.
