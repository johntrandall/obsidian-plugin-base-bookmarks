# Base Bookmarks

An Obsidian plugin that keeps a bookmark for every Base (`.base` file) in your vault, in a **Bases** group of the Bookmarks pane, so any Base is one click away.

Bases tend to live a few folders deep, among the notes they show. The Bookmarks pane is always one click away in the left sidebar, but bookmarking every Base by hand, in every vault, and keeping that list current as Bases come and go, is tedious. This plugin does it for you.

## What it does

- **When the vault opens**, it makes the **Bases** group in the Bookmarks pane hold one bookmark per Base in the vault, sorted by path.
- **When a Base is created, renamed, moved or deleted**, it updates the group within about a second, including changes made outside Obsidian (a `git pull`, a script, a sync tool).
- **It only manages the Bases group.** Bookmarks outside it are never touched. Anything else you put inside the group is kept, after the Bases.
- **No titles:** each bookmark shows the Base's file name, with its `.base` extension (Obsidian shows the extension for every file that is not Markdown), so good file names are what make the list readable.
- **Sync-safe start:** for the first minute after Obsidian loads, a bookmark whose Base is not on disk yet is kept (a sync tool may still be delivering it); the plugin looks again after that minute.
- **Skip patterns** keep noise out: git worktree copies, templates, test fixtures, vendored folders, archives, TaskNotes' default views and `Untitled*.base` files are skipped by default. Edit the list in Settings → Base Bookmarks. Bases in Obsidian's own Excluded files are skipped as well.
- **Re-check:** every 5 minutes it looks again and repairs the group if something was missed; it writes nothing when the group is in step.
- **Command:** "Base Bookmarks: Bookmark all Bases now" rebuilds the group on demand (also a button in the settings).
- Works on desktop and mobile. Writes nothing but bookmarks and its own settings.

If you used [obsidian-vault-setup](https://github.com/johntrandall/obsidian-vault-setup)'s `bookmark_bases`, the plugin moves those top-level "Base · <name>" bookmarks into the group on its first run, so no Base appears twice.

Disabling or uninstalling the plugin leaves the group as it is; delete it from the Bookmarks pane if you no longer want it.

## Install

Not in the community directory. Install with [BRAT](https://github.com/TfTHacker/obsidian42-brat): add the beta plugin `johntrandall/obsidian-plugin-base-bookmarks`, then switch it on under Settings → Community plugins. The Bookmarks core plugin must be on.

## Undocumented API

Obsidian's plugin API has no interface to the Bookmarks core plugin, so this plugin uses the core plugin's own methods. They were read from Obsidian 1.15.0 on 2026-10-28; every run checks they exist and does nothing, with a notice, if they do not.

| Member | Used for | If it disappears |
|---|---|---|
| `app.internalPlugins.getPluginById("bookmarks").instance` | reaching the Bookmarks plugin | notice; no bookmarks made |
| `instance.items` | reading the current bookmarks (groups hold `items`) | notice |
| `instance.addItem(item, parent)` | creating the Bases group | notice |
| `instance.moveItem(item, group, index)` | placing a bookmark in the group (sets its parent link) | notice |
| `instance.removeItem(item)` | removing old top-level "Base · " bookmarks and duplicate groups | notice |
| `instance.editItem(item)` | saving once after a batch | notice |
| `instance.saveData` (held during a batch) | one save per batch instead of one per bookmark | the plugin saves per bookmark instead |
| `app.metadataCache.isUserIgnored(path)` | honouring Obsidian's Excluded files | Excluded files are not skipped |
| `instance.on("changed")` | healing the group after a sync tool replaces `bookmarks.json` | the group heals at the next vault open or Base change |

Two behaviours, checked on Obsidian 1.15.0 (macOS): renaming a Base inside Obsidian updates its bookmark; renaming or deleting it outside Obsidian leaves a stale bookmark, which this plugin removes.

## Develop

```bash
npm install
npm test          # node --test, Node 23.6 or later (strips TypeScript types itself)
npm run build     # typecheck, then esbuild to main.js
make release      # tag HEAD with manifest.json's version and push; GitHub Actions publishes the release
```

`src/plan.ts` is the pure planning logic (which Bases, what the group should hold) and has the unit tests, with fixtures from real vaults in `test/fixtures/`. `src/main.ts` wires it to Obsidian. The design and its decisions are in [docs/design.md](docs/design.md).

## License

MIT
