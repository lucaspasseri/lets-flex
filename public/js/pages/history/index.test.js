import assert from "node:assert/strict";
import test from "node:test";

import { initializeHistoryScrollRestoration } from "./index.js";

class StorageFake {
	values = new Map();

	getItem(key) {
		return this.values.get(key) ?? null;
	}

	setItem(key, value) {
		this.values.set(key, value);
	}

	removeItem(key) {
		this.values.delete(key);
	}
}

function createHarness() {
	const listeners = new Map();
	const storage = new StorageFake();
	const content = {
		scrollTop: 480,
		scrollLeft: 12,
	};
	const detailLink = {
		listener: null,
		addEventListener(_type, listener) {
			this.listener = listener;
		},
	};
	const page = {
		querySelectorAll() {
			return [detailLink];
		},
	};
	const root = {
		querySelector(selector) {
			return selector === "[data-page-content]" ? content : page;
		},
	};
	const windowRef = {
		location: {
			pathname: "/history",
			search: "?page=2",
			hash: "#history-results-heading",
		},
		sessionStorage: storage,
		performance: {
			getEntriesByType() {
				return [{ type: "navigate" }];
			},
		},
		requestAnimationFrame(callback) {
			callback();
		},
		addEventListener(type, listener) {
			listeners.set(type, listener);
		},
	};

	globalThis.HTMLElement = class {};
	Object.setPrototypeOf(content, HTMLElement.prototype);
	Object.setPrototypeOf(page, HTMLElement.prototype);

	return { content, detailLink, listeners, root, storage, windowRef };
}

test("history scroll restoration captures only detail navigation and restores once", () => {
	const harness = createHarness();
	initializeHistoryScrollRestoration(
		/** @type {any} */ (harness.root),
		/** @type {any} */ (harness.windowRef),
	);

	harness.detailLink.listener({
		button: 0,
		defaultPrevented: false,
		metaKey: false,
		ctrlKey: false,
		shiftKey: false,
		altKey: false,
	});

	assert.equal(
		harness.storage.getItem("lets-flex:history-scroll:/history?page=2"),
		JSON.stringify({ top: 480, left: 12 }),
	);

	harness.content.scrollTop = 0;
	harness.content.scrollLeft = 0;
	harness.listeners.get("pageshow")?.();

	assert.equal(harness.content.scrollTop, 480);
	assert.equal(harness.content.scrollLeft, 12);
	assert.equal(
		harness.storage.getItem("lets-flex:history-scroll:/history?page=2"),
		null,
	);
});

test("history scroll restoration ignores modified and invalid activations", () => {
	const harness = createHarness();
	initializeHistoryScrollRestoration(
		/** @type {any} */ (harness.root),
		/** @type {any} */ (harness.windowRef),
	);

	harness.detailLink.listener({
		button: 0,
		defaultPrevented: false,
		metaKey: true,
		ctrlKey: false,
		shiftKey: false,
		altKey: false,
	});
	assert.equal(harness.storage.values.size, 0);

	harness.storage.setItem("lets-flex:history-scroll:/history?page=2", "invalid");
	harness.listeners.get("pageshow")?.();
	assert.equal(harness.content.scrollTop, 480);

	harness.storage.setItem(
		"lets-flex:history-scroll:/history?page=2",
		JSON.stringify({ top: 900, left: 0 }),
	);
	harness.content.scrollTop = 0;
	harness.windowRef.location.hash = "";
	harness.listeners.get("pageshow")?.();
	assert.equal(harness.content.scrollTop, 0);
	assert.equal(
		harness.storage.getItem("lets-flex:history-scroll:/history?page=2"),
		null,
	);
});
