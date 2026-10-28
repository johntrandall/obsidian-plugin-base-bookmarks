---
title: Base Bookmarks — design
status: draft for John's review (revision 3)
date: 2026-10-28
author: watchbill architect session 8be48108
owner: John Randall
---

# Base Bookmarks — design

## Start here

**What this is.** The design, not yet built, of a very small Obsidian plugin with one job: keep a bookmark for every Base in the vault, inside a **Bases** group of Obsidian's Bookmarks pane, so any Base is one click away. Written for John, who owns the project and approves this design before anything is built, and for the agent that builds it. Revision 3 replaces the earlier sidebar-panel designs (revisions 1 and 2, in git history) after John's answers of 2026-10-28; the questions and answers are in [questions-round-1.md](questions-round-1.md) and in the Decided table below.

**Terms.**
- **Base**: a `.base` file, Obsidian's core Bases feature: a YAML file holding filters and one or more named views (kanban, table) over the vault's notes.
- **Bookmarks pane**: Obsidian's core Bookmarks plugin, a pane in the left sidebar that lists bookmarked files, optionally inside named **groups** (collapsible folders).
- **Watchbill**: John's system of agent-run projects. Each project shows John its work through Bases (its decision board `dev-docs/decisions/_decisions.base`, often an operations board at the vault root). Watchbill is the use case, not a dependency.
- **Vault setup**: the `obsidian-vault-setup` tool (Homebrew; source `~/dev/obsidian-vault-setup`), which creates vaults and installs and configures their plugins through Obsidian's own CLI, from the plugin manifest `~/admin-technical/inventories/obsidian-plugins.yaml`.
- **BRAT**: the community plugin that installs plugins from a GitHub repo, and can update them each time a vault opens.
- **LiveSync**: the self-hosted sync plugin carrying John's vaults between the Mac (SusanBones) and the iPad (Mel).

**Why it exists.** John flips between Bases to see what each system's architect and steward are doing, and Obsidian buries them two folders deep among hundreds of records. Vault setup already bookmarks every Base, but only when it runs, so a Base an agent creates later is not bookmarked, and nothing runs on the iPad. John, 2026-10-28: "perhaps this thing just needs to auto-bookmark every base. I think that would be good enough."

## Decided (John, 2026-10-28, in chat)

| #   | Decision                                                                                                                                                           | John's words                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Scope is one vault: the plugin works on the vault it runs in.                                                                                                      | "For now the flipping is inside one vault."                                                                                                                                                                                                   |
| D2  | The plugin auto-bookmarks every Base; the Bookmarks pane is the list.                                                                                              | "perhaps this thing just needs to auto-bookmark every base. I think that would be good enough."                                                                                                                                               |
| D3  | A plugin, which vault setup installs and can trigger.                                                                                                              | "Probably a plugin and then the setup can just run the plugin."                                                                                                                                                                               |
| D4  | It fires at a set time (vault open) and on file creation, filtered to `.base`.                                                                                     | "the plugin can just do something at a certain time that bookmarks all the bases … Is there a way a hook for a plugin to fire on file creation? Can that be filtered by extension?"                                                           |
| D5  | The bookmarks sit in a **Bases** group.                                                                                                                            | "Yes, put the plugins in a bases group."                                                                                                                                                                                                      |
| D6  | A bookmark carries no title of its own: it shows the file's name. Good file names are the fix, not bookmark titles.                                                | "The bookmark titles can just be how … the files are titled in the repo. Better to get a good file name convention there than worry about bookmarking titles."                                                                                |
| D7  | Runs on the Mac and the iPad.                                                                                                                                      | "It needs to run on Mac as well as iPad."                                                                                                                                                                                                     |
| D8  | Independent of watchbill; John owns it; shipped through BRAT and added to every vault by vault setup.                                                              | "This plugin should be independent of Watchbill, but my use case is Watchbill." "I own it. It's an Obsidian plugin. It gets installed … probably with BRAT and the … installer setup should add it as a default plugin on all of our vaults." |
| D9  | Repo name `obsidian-plugin-base-bookmarks`; plugin id `base-bookmarks`. Recorded as a convention in `naming-governance.md` item 9 and the `dev-repo-naming` skill. | "Obsidian plugin dash plugin name."                                                                                                                                                                                                           |
| D10 | Existing plugin repos are not renamed now.                                                                                                                         | "Existing plugin repos don't need to be renamed right now."                                                                                                                                                                                   |
| D11 | BRAT stays switched on with update-at-startup, so our GitHub plugins update themselves. A request to the plugin manifest, written with this design.                | "This sounds good."                                                                                                                                                                                                                           |

## What it does

1. **On vault open**, once Obsidian has finished indexing (`workspace.onLayoutReady`), it makes the **Bases** group match the vault: one bookmark per Base that passes the filter, sorted by path. Bookmarks for Bases that no longer exist are removed from the group.
2. **On a new, renamed or deleted `.base` file** it updates the group within about a second. The vault's `create`, `rename` and `delete` events fire for every file; the plugin ignores any file whose extension is not `base`. It subscribes only after the vault has loaded, because Obsidian also fires `create` for every existing file while a vault opens.
3. **A command**, "Base Bookmarks: bookmark all Bases now", runs step 1 on demand. Vault setup calls it after installing the plugin (`obsidian vault=<name> command id=base-bookmarks:sync`).
4. **It owns only the Bases group.** It never touches bookmarks outside it. On its first run in a vault it moves vault setup's top-level "Base · <name>" bookmarks for the same files into the group, so no Base appears twice; after that, vault setup stops bookmarking Bases (rollout, below).
5. **Titles (D6):** bookmarks are added without a title, so the pane shows the file's name (`_decisions`, `_drafts`, `operations`).
6. **Nothing else.** No panel, no settings screen beyond the skip list, no writing of notes or Bases.

## Which Bases: the skip list

Most vaults with many Bases hold copies and leftovers, not boards (scan of all 80 registered vaults, 2026-10-28). A Base whose path matches a skip pattern is not bookmarked. Defaults, each traced to a vault where the scan found it; John or an agent can edit the list in the plugin's settings:

| Skip pattern | Why |
|---|---|
| `**/.worktrees/**`, `**/.claude/worktrees/**` | git worktree copies duplicate every board (auto-coder, mantisflow) |
| `**/templates/**`, `**/tests/fixtures/**` | templates and test fixtures (claude-plugin-watchbill, software-upkeep) |
| `**/vendor/**`, `**/vendor-docs/**`, `**/node_modules/**` | vendored repos (ios-app-manager, _resources) |
| `TaskNotes/Views/**` | TaskNotes' auto-created default views (job-hunt-applications) |
| `**/zArchive/**`, `**/archive/**` | archived material |
| `**/Untitled*.base` | unnamed experiments (seven vaults). A Base made in Obsidian starts as `Untitled.base`, so it is bookmarked when it is renamed |

With these, every watchbill system vault in the scan gets 2 to 5 bookmarks. A vault such as the `~/dev` umbrella (1,103 Bases) would get hundreds; the Bookmarks pane scrolls, and the group can be collapsed. If that is a problem in practice, a cap is a later change.

## How it is built

- **A plain Obsidian plugin** in TypeScript from the official sample-plugin layout, built with esbuild into one `main.js`. No runtime dependencies; the few glob forms above are matched by a small hand-written matcher. No `fs`, `path`, Electron or Node call anywhere, and `isDesktopOnly: false`, so it runs on the iPad (D7).
- **The matching is one pure function**, `plan(basePaths, groupItems, skipList) → { add, remove }`, unit-tested (vitest) against the path lists captured from the scan.
- **Bookmarks are written through the Bookmarks plugin's own methods**, inside the running app: `app.internalPlugins.getPluginById('bookmarks').instance` with `addItem`, `removeItem` and `getBookmarks` (methods listed in this vault 2026-10-28, Obsidian 1.15.0). Obsidian then writes its own `bookmarks.json`; the plugin never edits that file. This interface is **not part of Obsidian's published plugin API**: the call site carries a comment saying so, the README's "Undocumented API" table records it (the `undocumented-api-usage` pattern vault setup already follows), and the plugin checks the methods exist and shows a one-line notice instead of failing silently if a future Obsidian removes them.
- **Event behaviour, Verified 2026-10-28 on the Mac:** a listener on `vault.on('create')` filtered to `extension === 'base'` received `TEST-create-event.base` written from the shell within 3 s (test file removed afterwards).
- **Repo**: `~/dev/obsidian-plugin-base-bookmarks` (D9; this folder is renamed with Obsidian's "Move vault", which keeps the vault's identity), public GitHub repo `johntrandall/obsidian-plugin-base-bookmarks` with a release per version (`manifest.json`, `main.js` as release assets) for BRAT, and the on-prem Forgejo mirror.

## Rollout (D8, D11)

These are changes to the plugin manifest `~/admin-technical/inventories/obsidian-plugins.yaml` and to vault setup, made after this plugin's first release passes its gate:

1. Add `base-bookmarks` to the manifest: `source: github`, `install: brat`, `repo: johntrandall/obsidian-plugin-base-bookmarks`, in `always_on`, so vault setup installs and switches it on in every new vault and in every existing vault on its next `apply`, then runs the plugin's command once.
2. Switch vault setup's own `bookmark_bases` off, so the two never compete.
3. Leave BRAT switched on in every vault with update-at-startup on (D11). Today vault setup switches BRAT off after installing, so the Track Changes fork never updates itself (checked in this vault 2026-10-28: BRAT not loaded, `updateAtStartup: true` in its settings). The risk: a bad release reaches every vault on its next open; the release gate below is the guard.
4. Vaults on LiveSync carry the plugin and its settings to the iPad by Customisation Sync.
5. Also to check for D11: whether Obsidian can install community-directory plugin updates by itself (not verified; believed manual).

## First build cycle (after John approves this design)

1. **Spike** (about an hour, in this vault): on Mel, a Base arriving through LiveSync fires `create`; whether Obsidian already updates or removes a bookmark when its file is renamed or deleted (if it does, the plugin needs less); `addItem` into a group works on mobile; and check the community plugin list for an existing auto-bookmark plugin (adopt or fork it if one exists).
2. **Build** the plugin, its command, the skip list and the first-run move of vault setup's bookmarks.
3. **Gate**, what "done" means, each with evidence: the `plan` unit tests pass on the scan's path lists (job-hunt-resume gets 2 bookmarks; claude-plugin-watchbill and job-hunt-applications only their real boards); on the Mac and on Mel, opening a system vault produces the Bases group with no console errors; creating, renaming and deleting a `TEST` Base updates the group within a few seconds; bookmarks outside the group are untouched; a screenshot of the Bookmarks pane on each device, looked at, not only measured.

## Open, not blocking the design

- **LiveSync for this vault** is blocked by the Time Machine check (newest snapshot 2026-10-26, older than the vault); John to run a backup or waive the check.
