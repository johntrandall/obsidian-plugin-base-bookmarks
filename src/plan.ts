// Pure planning logic: which Bases should be bookmarked, and how the
// Bookmarks pane's "Bases" group differs from that. No Obsidian imports, so
// it runs under `node --test` (test/plan.test.ts).

export const GROUP_TITLE = "Bases";

// obsidian-vault-setup (0.1.7+) bookmarks every Base at the top level with
// this title prefix. The plugin moves those into the group on its first run.
export const LEGACY_TITLE_PREFIX = "Base · ";

// Each default is traced to a vault where the 2026-10-28 scan found noise
// (docs/design.md, "Which Bases: the skip list").
export const DEFAULT_SKIP: string[] = [
	"**/.worktrees/**",
	"**/.claude/worktrees/**",
	"**/templates/**",
	"**/tests/fixtures/**",
	"**/vendor/**",
	"**/vendor-docs/**",
	"**/node_modules/**",
	"TaskNotes/Views/**",
	"**/zArchive/**",
	"**/archive/**",
	"**/Untitled*.base",
];

// The shape Obsidian's core Bookmarks plugin keeps in memory and in
// bookmarks.json. Only the fields this plugin reads are typed.
export interface BookmarkItem {
	type: string;
	ctime?: number;
	path?: string;
	subpath?: string;
	title?: string;
	items?: BookmarkItem[];
}

// Glob to anchored regex. Supports `**/` (zero or more folders), `/**` and
// `**` (anything), `*` (anything but a slash) and `?` (one character but a
// slash). Enough for vault-relative paths; nothing else is special.
export function globToRegExp(glob: string): RegExp {
	let out = "";
	let i = 0;
	while (i < glob.length) {
		if (glob.startsWith("**/", i)) {
			out += "(?:.*/)?";
			i += 3;
		} else if (glob.startsWith("**", i)) {
			out += ".*";
			i += 2;
		} else if (glob[i] === "*") {
			out += "[^/]*";
			i += 1;
		} else if (glob[i] === "?") {
			out += "[^/]";
			i += 1;
		} else {
			out += glob[i].replace(/[.+^${}()|[\]\\]/g, "\\$&");
			i += 1;
		}
	}
	return new RegExp("^" + out + "$");
}

export function compileSkip(patterns: string[]): RegExp[] {
	return patterns
		.map((p) => p.trim())
		.filter((p) => p.length > 0 && !p.startsWith("#"))
		.map(globToRegExp);
}

export function isBasePath(path: string | undefined): boolean {
	return typeof path === "string" && path.toLowerCase().endsWith(".base");
}

// The Bases to bookmark, sorted by path so a system's boards sit together.
export function wantedBases(paths: string[], skip: RegExp[]): string[] {
	return paths
		.filter(isBasePath)
		.filter((p) => !skip.some((re) => re.test(p)))
		.sort((a, b) => a.localeCompare(b));
}

export function isLegacyBookmark(item: BookmarkItem): boolean {
	return (
		item.type === "file" &&
		isBasePath(item.path) &&
		!item.subpath &&
		typeof item.title === "string" &&
		item.title.startsWith(LEGACY_TITLE_PREFIX)
	);
}

function isPlainBaseBookmark(item: BookmarkItem): boolean {
	return item.type === "file" && isBasePath(item.path) && !item.subpath;
}

export interface Plan {
	// The group to keep (null: create one).
	group: BookmarkItem | null;
	// Further top-level "Bases" groups (two devices each made one before
	// sync met); their Base bookmarks fold into the kept group.
	duplicateGroups: BookmarkItem[];
	// Top-level "Base · <name>" bookmarks from obsidian-vault-setup.
	legacy: BookmarkItem[];
	// Base bookmarks in the group whose Base is gone or now skipped, and
	// second copies of the same path.
	stale: BookmarkItem[];
	// The paths the group's Base bookmarks must hold, in this order, ahead
	// of anything else John keeps in the group.
	desired: string[];
	changed: boolean;
}

export interface PlanOptions {
	// False while a sync tool may still be delivering files (the first minute
	// after load): a missing Base may only not have arrived yet, so its
	// bookmark is kept. Duplicates are still removed.
	removeMissing?: boolean;
}

export function plan(basePaths: string[], topItems: BookmarkItem[], skipPatterns: string[], options: PlanOptions = {}): Plan {
	const removeMissing = options.removeMissing ?? true;
	const skip = compileSkip(skipPatterns);
	const present = wantedBases(basePaths, skip);
	const wanted = new Set(present);
	// While holding removals, a bookmarked Base that is not on disk yet keeps
	// its place, unless a skip pattern now excludes it.
	if (!removeMissing) {
		for (const g of topItems.filter((it) => it.type === "group" && it.title === GROUP_TITLE)) {
			for (const it of g.items ?? []) {
				if (isPlainBaseBookmark(it) && !skip.some((re) => re.test(it.path as string))) wanted.add(it.path as string);
			}
		}
	}
	const desired = [...wanted].sort((a, b) => a.localeCompare(b));

	const groups = topItems.filter((it) => it.type === "group" && it.title === GROUP_TITLE);
	const group = groups.length > 0 ? groups[0] : null;
	const duplicateGroups = groups.slice(1);
	const legacy = topItems.filter(isLegacyBookmark);

	const stale: BookmarkItem[] = [];
	const seen = new Set<string>();
	for (const it of group?.items ?? []) {
		if (!isPlainBaseBookmark(it)) continue;
		const path = it.path as string;
		if (!wanted.has(path) || seen.has(path)) stale.push(it);
		else seen.add(path);
	}

	const current = (group?.items ?? []).filter((it) => isPlainBaseBookmark(it) && !stale.includes(it)).map((it) => it.path);
	const inOrder = current.length === desired.length && current.every((p, i) => p === desired[i]);
	const leadsGroup = (group?.items ?? []).slice(0, desired.length).every(isPlainBaseBookmark);

	// An empty vault with no group needs nothing: never create an empty group.
	const needsGroup = group === null && desired.length > 0;
	const changed =
		needsGroup || duplicateGroups.length > 0 || legacy.length > 0 || stale.length > 0 || !inOrder || !leadsGroup;

	return { group, duplicateGroups, legacy, stale, desired, changed };
}
