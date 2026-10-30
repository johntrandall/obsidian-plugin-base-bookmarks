// Read-only health probe for Base Bookmarks, for the architect's watch.
// For every vault registered in Obsidian that has the plugin installed, it
// compares the vault's Bases on disk with the saved "Bases" bookmark group,
// using the plugin's own planning logic (src/plan.ts), and prints one line per
// vault. It never writes. Node 23.6+ (imports TypeScript directly).
//
//   node tools/probe.mjs            # every vault with the plugin
//   node tools/probe.mjs --open     # only vaults Obsidian has open
//   node tools/probe.mjs --problems # print only vaults out of step
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_SKIP, plan } from "../src/plan.ts";

const args = new Set(process.argv.slice(2));
const registry = JSON.parse(
	readFileSync(join(homedir(), "Library/Application Support/obsidian/obsidian.json"), "utf8"),
);

// Obsidian does not index dot-folders, so neither does the probe. It does
// follow symlinks (the ~/decisions vault is built from them), so the probe
// does too, guarding against loops by real path.
function basePaths(root) {
	const out = [];
	const visited = new Set();
	const walk = (dir, rel) => {
		let real;
		try {
			real = realpathSync(dir);
		} catch {
			return;
		}
		if (visited.has(real)) return;
		visited.add(real);
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			if (e.name.startsWith(".") || e.name === "node_modules") continue;
			const r = rel ? `${rel}/${e.name}` : e.name;
			let isDir = e.isDirectory();
			if (e.isSymbolicLink()) {
				try {
					isDir = statSync(join(dir, e.name)).isDirectory();
				} catch {
					continue;
				}
			}
			if (isDir) walk(join(dir, e.name), r);
			else if (e.name.toLowerCase().endsWith(".base")) out.push(r);
		}
	};
	walk(root, "");
	return out;
}

const readJson = (p, fallback) => {
	try {
		return JSON.parse(readFileSync(p, "utf8"));
	} catch {
		return fallback;
	}
};

let problems = 0;
const seen = new Set();
for (const v of Object.values(registry.vaults ?? {})) {
	if (seen.has(v.path)) continue;
	seen.add(v.path);
	if (args.has("--open") && !v.open) continue;
	const pluginDir = join(v.path, ".obsidian/plugins/base-bookmarks");
	if (!existsSync(join(pluginDir, "manifest.json"))) continue;
	const version = readJson(join(pluginDir, "manifest.json"), {}).version ?? "?";
	const enabled = readJson(join(v.path, ".obsidian/community-plugins.json"), []).includes("base-bookmarks");
	const skip = readJson(join(pluginDir, "data.json"), {}).skip ?? DEFAULT_SKIP;
	const items = readJson(join(v.path, ".obsidian/bookmarks.json"), { items: [] }).items ?? [];
	const p = plan(basePaths(v.path), items, skip);
	const inGroup = (p.group?.items ?? []).filter((it) => it.type === "file" && String(it.path).endsWith(".base")).length;
	const ok = enabled && !p.changed;
	if (!ok) problems++;
	if (args.has("--problems") && ok) continue;
	const why = !enabled
		? "plugin installed but not enabled"
		: p.changed
			? `out of step: want ${p.desired.length}, group ${inGroup}, stale ${p.stale.length}, legacy ${p.legacy.length}, duplicate groups ${p.duplicateGroups.length}`
			: `ok: ${p.desired.length} Bases bookmarked`;
	console.log(`${v.open ? "open  " : "closed"} ${v.path.replace(homedir(), "~")} ${version} ${why}`);
}
process.exitCode = problems > 0 ? 1 : 0;
