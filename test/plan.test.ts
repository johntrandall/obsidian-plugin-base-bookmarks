// Unit tests for src/plan.ts. Run with `npm test` (node --test; Node 23.6+
// strips the TypeScript types itself). Fixtures are the real .base path lists
// of five vaults, captured 2026-10-28.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { BookmarkItem } from "../src/plan.ts";
import { DEFAULT_SKIP, GROUP_TITLE, compileSkip, globToRegExp, plan, wantedBases } from "../src/plan.ts";

const fixture = (name: string): string[] =>
	readFileSync(new URL(`./fixtures/${name}.txt`, import.meta.url), "utf8").split("\n").filter((l) => l.length > 0);

const skip = compileSkip(DEFAULT_SKIP);
const file = (path: string, title?: string): BookmarkItem => (title ? { type: "file", path, title } : { type: "file", path });
const group = (items: BookmarkItem[], title = GROUP_TITLE): BookmarkItem => ({ type: "group", title, items });

test("glob: ** spans folders, including none; * stays in one folder", () => {
	const re = globToRegExp("**/.worktrees/**");
	assert.ok(re.test(".worktrees/a/b.base"));
	assert.ok(re.test("x/.worktrees/a.base"));
	assert.ok(!re.test("worktrees/a.base"));
	const untitled = globToRegExp("**/Untitled*.base");
	assert.ok(untitled.test("Untitled.base"));
	assert.ok(untitled.test("a/Untitled 2.base"));
	assert.ok(!untitled.test("a/Untitled/b.base"));
	assert.ok(globToRegExp("TaskNotes/Views/**").test("TaskNotes/Views/agenda-default.base"));
	assert.ok(!globToRegExp("TaskNotes/Views/**").test("x/TaskNotes/Views/a.base"));
	assert.ok(globToRegExp("a.base").test("a.base") && !globToRegExp("a.base").test("aXbase"));
});

test("real vaults: the skip list leaves each system's real boards", () => {
	assert.deepEqual(wantedBases(fixture("job-hunt-resume"), skip), [
		"dev-docs/decisions/_decisions.base",
		"dev-docs/substantive/_substantive.base",
	]);
	assert.deepEqual(wantedBases(fixture("job-hunt-applications"), skip), [
		"applications/_applications.base",
		"dev-docs/decisions/_decisions.base",
		"dev-docs/substantive/_substantive.base",
	]);
	assert.deepEqual(wantedBases(fixture("auto-coder"), skip), ["docs/work-items/_index.base", "docs/work-items/_wi-dashboard.base"]);
	assert.deepEqual(wantedBases(fixture("software-upkeep"), skip), [
		"_upkeep.base",
		"dev-docs/decisions/_decisions.base",
		"dev-docs/substantive/_substantive.base",
	]);
	const watchbill = wantedBases(fixture("claude-plugin-watchbill"), skip);
	assert.equal(watchbill.length, 7);
	assert.ok(!watchbill.some((p) => p.includes("templates/") || p.startsWith("Untitled")));
});

test("empty vault: no group is created", () => {
	const p = plan([], [file("notes/a.md")], DEFAULT_SKIP);
	assert.equal(p.changed, false);
	assert.equal(p.group, null);
});

test("first run: a group is needed for the wanted Bases", () => {
	const p = plan(fixture("job-hunt-resume"), [file("notes/a.md")], DEFAULT_SKIP);
	assert.equal(p.changed, true);
	assert.equal(p.group, null);
	assert.deepEqual(p.desired, ["dev-docs/decisions/_decisions.base", "dev-docs/substantive/_substantive.base"]);
});

test("in step: nothing to do", () => {
	const g = group([file("dev-docs/decisions/_decisions.base"), file("dev-docs/substantive/_substantive.base")]);
	const p = plan(fixture("job-hunt-resume"), [file("notes/a.md"), g], DEFAULT_SKIP);
	assert.equal(p.changed, false);
	assert.equal(p.group, g);
});

test("John's own items in the group are kept, after the Bases", () => {
	const mine = file("notes/plan.md");
	const g = group([file("dev-docs/decisions/_decisions.base"), file("dev-docs/substantive/_substantive.base"), mine]);
	assert.equal(plan(fixture("job-hunt-resume"), [g], DEFAULT_SKIP).changed, false);
	// John dragged his note above the Bases: the Bases move back to the top.
	const g2 = group([mine, file("dev-docs/decisions/_decisions.base"), file("dev-docs/substantive/_substantive.base")]);
	const p2 = plan(fixture("job-hunt-resume"), [g2], DEFAULT_SKIP);
	assert.equal(p2.changed, true);
	assert.deepEqual(p2.stale, []);
});

test("a deleted or renamed-outside-Obsidian Base leaves a stale bookmark to remove", () => {
	const gone = file("dev-docs/decisions/_old.base");
	const g = group([file("dev-docs/decisions/_decisions.base"), gone, file("dev-docs/substantive/_substantive.base")]);
	const p = plan(fixture("job-hunt-resume"), [g], DEFAULT_SKIP);
	assert.equal(p.changed, true);
	assert.deepEqual(p.stale, [gone]);
});

test("a second copy of the same Base in the group is stale", () => {
	const twice = file("dev-docs/decisions/_decisions.base");
	const g = group([file("dev-docs/decisions/_decisions.base"), file("dev-docs/substantive/_substantive.base"), twice]);
	const p = plan(fixture("job-hunt-resume"), [g], DEFAULT_SKIP);
	assert.deepEqual(p.stale, [twice]);
});

test("a newly skipped Base is removed from the group", () => {
	const g = group([file("dev-docs/decisions/_decisions.base"), file("dev-docs/substantive/_substantive.base")]);
	const p = plan(fixture("job-hunt-resume"), [g], [...DEFAULT_SKIP, "dev-docs/substantive/**"]);
	assert.equal(p.stale.length, 1);
	assert.deepEqual(p.desired, ["dev-docs/decisions/_decisions.base"]);
});

test("vault-setup's top-level 'Base · ' bookmarks are moved, other bookmarks untouched", () => {
	const legacy = file("dev-docs/decisions/_decisions.base", "Base · _decisions");
	const johns = file("dev-docs/substantive/_substantive.base", "My queue");
	const p = plan(fixture("job-hunt-resume"), [legacy, johns, file("notes/a.md")], DEFAULT_SKIP);
	assert.deepEqual(p.legacy, [legacy]);
	assert.equal(p.changed, true);
});

test("two Bases groups (one per device before sync met) are folded into the first", () => {
	const g1 = group([file("dev-docs/decisions/_decisions.base"), file("dev-docs/substantive/_substantive.base")]);
	const g2 = group([file("dev-docs/decisions/_decisions.base")]);
	const p = plan(fixture("job-hunt-resume"), [g1, g2], DEFAULT_SKIP);
	assert.equal(p.group, g1);
	assert.deepEqual(p.duplicateGroups, [g2]);
	assert.equal(p.changed, true);
});

test("a group nested inside another group, or with another title, is not ours", () => {
	const other = group([file("dev-docs/decisions/_decisions.base")], "Boards");
	const p = plan(fixture("job-hunt-resume"), [other], DEFAULT_SKIP);
	assert.equal(p.group, null);
	assert.equal(p.changed, true);
});

test("a bookmark to a heading inside a Base (subpath) is left alone", () => {
	const view: BookmarkItem = { type: "file", path: "dev-docs/decisions/_decisions.base", subpath: "#1 · STATUS" };
	const g = group([file("dev-docs/decisions/_decisions.base"), file("dev-docs/substantive/_substantive.base"), view]);
	const p = plan(fixture("job-hunt-resume"), [g], DEFAULT_SKIP);
	assert.equal(p.changed, false);
});

test("large vault: hundreds of Bases plan quickly", () => {
	const many = Array.from({ length: 1200 }, (_, i) => `sys${i % 60}/dev-docs/decisions/_b${i}.base`);
	const t0 = Date.now();
	const p = plan(many, [], DEFAULT_SKIP);
	assert.equal(p.desired.length, 1200);
	assert.ok(Date.now() - t0 < 500);
});

test("first minute after load: a bookmarked Base not on disk yet is kept, then removed", () => {
	const late = file("dev-docs/runs/_late.base");
	const g = group([file("dev-docs/decisions/_decisions.base"), late, file("dev-docs/substantive/_substantive.base")]);
	const held = plan(fixture("job-hunt-resume"), [g], DEFAULT_SKIP, { removeMissing: false });
	assert.deepEqual(held.stale, []);
	assert.equal(held.changed, false);
	const after = plan(fixture("job-hunt-resume"), [g], DEFAULT_SKIP, { removeMissing: true });
	assert.deepEqual(after.stale, [late]);
});

test("first minute after load: a duplicate is still removed, a newly skipped Base still goes", () => {
	const twice = file("dev-docs/decisions/_decisions.base");
	const g = group([file("dev-docs/decisions/_decisions.base"), file("dev-docs/substantive/_substantive.base"), twice]);
	assert.deepEqual(plan(fixture("job-hunt-resume"), [g], DEFAULT_SKIP, { removeMissing: false }).stale, [twice]);
	const g2 = group([file("dev-docs/decisions/_decisions.base"), file("dev-docs/substantive/_substantive.base")]);
	const p2 = plan(fixture("job-hunt-resume"), [g2], [...DEFAULT_SKIP, "dev-docs/substantive/**"], { removeMissing: false });
	assert.equal(p2.stale.length, 1);
});
