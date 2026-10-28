import { App, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, debounce } from "obsidian";
import type { BookmarkItem } from "./plan";
import { DEFAULT_SKIP, GROUP_TITLE, isBasePath, plan } from "./plan";

interface BaseBookmarksSettings {
	skip: string[];
}

const DEFAULT_SETTINGS: BaseBookmarksSettings = { skip: DEFAULT_SKIP };

// UNDOCUMENTED API (README, "Undocumented API"). Obsidian's core Bookmarks
// plugin is not part of the published plugin API. These members were read
// from Obsidian 1.15.0 on 2026-10-28: `items` (the top-level list, groups hold
// `items`), `addItem(item, parentGroup?)`, `removeItem(item)`,
// `moveItem(item, parentGroup, index)` (sets the item's parent link),
// `editItem(item)` (saves), `saveData()`, and the Events method `on`.
// The plugin checks they exist before every run and does nothing, with a
// notice, if a future Obsidian removes them.
interface BookmarksInstance {
	items: BookmarkItem[];
	addItem(item: BookmarkItem, parent?: BookmarkItem | null): void;
	removeItem(item: BookmarkItem): void;
	moveItem(item: BookmarkItem, parent: BookmarkItem | null, index: number): void;
	editItem(item: BookmarkItem): void;
	saveData?: () => Promise<void>;
	on?: (name: string, callback: () => void) => unknown;
	off?: (name: string, callback: () => void) => void;
}

interface InternalPlugins {
	getPluginById(id: string): { enabled: boolean; instance: unknown } | null;
}

export default class BaseBookmarksPlugin extends Plugin {
	settings: BaseBookmarksSettings = { ...DEFAULT_SETTINGS };
	private warned = false;
	private applying = false;
	private readonly scheduleSync = debounce(() => void this.sync(false), 750, true);

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new BaseBookmarksSettingTab(this.app, this));
		this.addCommand({
			id: "sync",
			name: "Bookmark all Bases now",
			callback: () => void this.sync(true),
		});

		// While a vault opens Obsidian fires `create` for every existing file,
		// so subscribe only once the layout is ready, and do the full pass then.
		this.app.workspace.onLayoutReady(() => {
			const onFile = (file: TAbstractFile) => {
				if (file instanceof TFile && file.extension === "base") this.scheduleSync();
			};
			this.registerEvent(this.app.vault.on("create", onFile));
			this.registerEvent(this.app.vault.on("delete", onFile));
			this.registerEvent(
				this.app.vault.on("rename", (file, oldPath) => {
					if (isBasePath(oldPath) || (file instanceof TFile && file.extension === "base")) this.scheduleSync();
				}),
			);
			this.watchBookmarks();
			void this.sync(false);
		});
	}

	// Heal the group when bookmarks change underneath us: LiveSync bringing
	// the other device's bookmarks.json, or John editing the pane.
	private watchBookmarks(): void {
		const bm = this.bookmarks();
		if (!bm?.on || !bm.off) return;
		const onChanged = () => {
			if (!this.applying) this.scheduleSync();
		};
		bm.on("changed", onChanged);
		this.register(() => bm.off?.("changed", onChanged));
	}

	private bookmarks(): BookmarksInstance | null {
		const internal = (this.app as unknown as { internalPlugins?: InternalPlugins }).internalPlugins;
		const wrapper = internal?.getPluginById("bookmarks");
		if (!wrapper?.enabled) return null;
		const bm = wrapper.instance as Partial<BookmarksInstance> | undefined;
		const ok =
			!!bm &&
			Array.isArray(bm.items) &&
			typeof bm.addItem === "function" &&
			typeof bm.removeItem === "function" &&
			typeof bm.moveItem === "function" &&
			typeof bm.editItem === "function";
		return ok ? (bm as BookmarksInstance) : null;
	}

	// The in-memory list is empty but bookmarks.json holds items: Bookmarks
	// has not loaded yet. Saving now would overwrite John's bookmarks.
	private async notLoadedYet(bm: BookmarksInstance): Promise<boolean> {
		if (bm.items.length > 0) return false;
		const file = `${this.app.vault.configDir}/bookmarks.json`;
		try {
			if (!(await this.app.vault.adapter.exists(file))) return false;
			const data = JSON.parse(await this.app.vault.adapter.read(file)) as { items?: unknown[] };
			return Array.isArray(data.items) && data.items.length > 0;
		} catch {
			return true;
		}
	}

	async sync(manual: boolean): Promise<void> {
		const bm = this.bookmarks();
		if (!bm) {
			const msg = "Base Bookmarks: the Bookmarks core plugin is off, or this Obsidian changed it; no bookmarks were made.";
			if (manual || !this.warned) new Notice(msg);
			this.warned = true;
			return;
		}
		if (await this.notLoadedYet(bm)) {
			if (manual) new Notice("Base Bookmarks: bookmarks are still loading; try again in a moment.");
			window.setTimeout(() => this.scheduleSync(), 2000);
			return;
		}

		const paths = this.app.vault.getFiles().filter((f) => f.extension === "base").map((f) => f.path);
		const p = plan(paths, bm.items, this.settings.skip);
		if (!p.changed) {
			if (manual) new Notice(`Base Bookmarks: ${p.desired.length} Bases, already bookmarked.`);
			return;
		}

		this.applying = true;
		try {
			const group = this.batch(bm, () => {
				for (const item of p.legacy) bm.removeItem(item);

				let group = p.group;
				if (!group && p.desired.length > 0) {
					group = { type: "group", ctime: Date.now(), title: GROUP_TITLE, items: [] };
					bm.addItem(group);
				}
				if (!group) return null;
				const items = (group.items ??= []);

				// Fold a second "Bases" group (made on another device before sync
				// met) into this one: keep what John put there, drop its Bases.
				for (const dup of p.duplicateGroups) {
					for (const item of [...(dup.items ?? [])]) {
						if (!(item.type === "file" && isBasePath(item.path))) bm.moveItem(item, group, items.length);
					}
					bm.removeItem(dup);
				}

				for (const item of p.stale) {
					const i = items.indexOf(item);
					if (i >= 0) items.splice(i, 1);
				}

				// Put the Base bookmarks first, in path order. Take an item out of
				// the array before moveItem so it lands exactly at index i.
				p.desired.forEach((path, i) => {
					const at = items[i];
					if (at && at.type === "file" && at.path === path && !at.subpath) return;
					const j = items.findIndex((it) => it.type === "file" && it.path === path && !it.subpath);
					let item: BookmarkItem;
					if (j >= 0) item = items.splice(j, 1)[0];
					else item = { type: "file", ctime: Date.now(), path };
					bm.moveItem(item, group, i);
				});
				return group;
			});
			// One save for the whole batch.
			bm.editItem(group ?? { type: "group" });
			if (manual) new Notice(`Base Bookmarks: ${p.desired.length} Bases bookmarked.`);
		} finally {
			this.applying = false;
		}
	}

	// Bookmarks saves on every add and move; hold the saves while a batch runs
	// (hundreds of Bases in a large vault), then the caller saves once.
	private batch<T>(bm: BookmarksInstance, fn: () => T): T {
		const own = Object.prototype.hasOwnProperty.call(bm, "saveData");
		const original = bm.saveData;
		bm.saveData = async () => {};
		try {
			return fn();
		} finally {
			if (own) bm.saveData = original;
			else delete bm.saveData;
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}

class BaseBookmarksSettingTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: BaseBookmarksPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Bookmark all Bases now")
			.setDesc(`Rebuild the "${GROUP_TITLE}" bookmark group from the vault.`)
			.addButton((b) => b.setButtonText("Run").onClick(() => void this.plugin.sync(true)));

		new Setting(containerEl)
			.setName("Skip patterns")
			.setDesc("Bases whose vault path matches one of these patterns are not bookmarked. One per line; ** spans folders, * stays within one.")
			.addTextArea((t) => {
				t.inputEl.rows = 12;
				t.inputEl.cols = 40;
				t.setValue(this.plugin.settings.skip.join("\n")).onChange(async (value) => {
					this.plugin.settings.skip = value.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Restore default skip patterns")
			.addButton((b) =>
				b.setButtonText("Restore").onClick(async () => {
					this.plugin.settings.skip = [...DEFAULT_SKIP];
					await this.plugin.saveSettings();
					this.display();
				}),
			);
	}
}
