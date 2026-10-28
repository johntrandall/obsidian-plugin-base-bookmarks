# Changelog

## 0.1.1

- For the first minute after Obsidian loads, bookmarks of Bases that are not on disk yet are kept, not removed: on a phone or tablet a sync tool such as LiveSync may still be delivering them. The plugin looks again when the minute is over. (Found by the design verification of 2026-10-28.)
- Bases in Obsidian's own Excluded files (Settings → Files and links) are skipped too.

## 0.1.0

First release: keeps one bookmark per Base in a "Bases" group of the Bookmarks pane, on vault open and on every Base created, renamed, moved or deleted; skip patterns; moves obsidian-vault-setup's top-level "Base · " bookmarks into the group; folds duplicate groups from two devices.
