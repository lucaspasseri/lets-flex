import assert from "node:assert/strict";
import test from "node:test";

import {
	applyTheme,
	initializeThemeSelector,
	isSupportedTheme,
	normalizeTheme,
	persistTheme,
	readStoredTheme,
} from "./theme.js";

function createStorage(value = null, { throws = false } = {}) {
	return {
		value,
		getItem() {
			if (throws) throw new Error("storage unavailable");
			return this.value;
		},
		setItem(_key, nextValue) {
			if (throws) throw new Error("storage unavailable");
			this.value = nextValue;
		},
	};
}

class FakeThemeOption {
	dataset;
	checked = false;
	listeners = new Map();

	constructor(theme, label) {
		this.dataset = { themeOption: theme };
		this.label = label;
	}

	addEventListener(type, listener) {
		this.listeners.set(type, listener);
	}

	change() {
		this.listeners.get("change")?.({ currentTarget: this });
	}

	closest() {
		return {
			querySelector: () => ({ textContent: this.label }),
		};
	}
}

function createSelectorHarness(initialTheme = "classic") {
	const classic = new FakeThemeOption("classic", "Classic");
	const neon = new FakeThemeOption("neon", "Neon");
	const currentThemeStatus = { hidden: true };
	const currentThemeName = { textContent: "" };
	const selector = {
		attributes: new Map(),
		setAttribute(name, value) {
			this.attributes.set(name, value);
		},
		querySelectorAll() {
			return [classic, neon];
		},
		querySelector(selector) {
			return selector === "[data-theme-current]"
				? currentThemeStatus
				: currentThemeName;
		},
	};
	const documentRef = { documentElement: { dataset: { theme: initialTheme } } };
	const root = {
		ownerDocument: documentRef,
		querySelector() {
			return selector;
		},
	};

	return {
		classic,
		neon,
		selector,
		currentThemeStatus,
		currentThemeName,
		documentRef,
		root,
	};
}

test("theme values normalize to the two supported choices", () => {
	assert.equal(isSupportedTheme("classic"), true);
	assert.equal(isSupportedTheme("neon"), true);
	assert.equal(isSupportedTheme("middle-ground"), false);
	assert.equal(normalizeTheme("middle-ground"), "classic");
	assert.equal(readStoredTheme(createStorage("neon")), "neon");
	assert.equal(readStoredTheme(createStorage("stale")), "classic");
	assert.equal(readStoredTheme(createStorage("neon", { throws: true })), "classic");
});

test("theme selector applies the active choice immediately and persists it", () => {
	const {
		classic,
		neon,
		selector,
		currentThemeStatus,
		currentThemeName,
		documentRef,
		root,
	} = createSelectorHarness();
	const storage = createStorage();

	initializeThemeSelector(root, { documentRef, storage });
	assert.equal(classic.checked, true);
	assert.equal(neon.checked, false);
	assert.equal(selector.attributes.get("data-active-theme"), "classic");
	assert.equal(currentThemeStatus.hidden, false);
	assert.equal(currentThemeName.textContent, "Classic");

	neon.checked = true;
	neon.change();

	assert.equal(documentRef.documentElement.dataset.theme, "neon");
	assert.equal(storage.value, "neon");
	assert.equal(classic.checked, false);
	assert.equal(neon.checked, true);
	assert.equal(selector.attributes.get("data-active-theme"), "neon");
	assert.equal(currentThemeName.textContent, "Neon");

	classic.checked = true;
	classic.change();
	assert.equal(documentRef.documentElement.dataset.theme, "classic");
	assert.equal(storage.value, "classic");
});

test("theme application and persistence remain safe when storage is unavailable", () => {
	const documentRef = { documentElement: { dataset: {} } };
	const storage = createStorage("neon", { throws: true });

	assert.equal(applyTheme("neon", documentRef), "neon");
	assert.equal(documentRef.documentElement.dataset.theme, "neon");
	assert.equal(persistTheme("neon", storage), "neon");
});
