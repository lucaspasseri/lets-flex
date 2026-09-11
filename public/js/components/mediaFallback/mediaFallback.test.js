import assert from "node:assert/strict";
import test from "node:test";

import { initializeMediaFallback } from "./mediaFallback.js";

const originalHTMLImageElement = globalThis.HTMLImageElement;

test.afterEach(() => {
	if (originalHTMLImageElement === undefined) delete globalThis.HTMLImageElement;
	else globalThis.HTMLImageElement = originalHTMLImageElement;
});

class FakeImage {
	hidden = false;
	attributes = new Map();
	listeners = new Map();
	parent = null;

	addEventListener(type, listener) {
		this.listeners.set(type, listener);
	}

	setAttribute(name, value) {
		this.attributes.set(name, value);
	}

	closest(selector) {
		return selector === "figure[data-media-fallback]" ? this.parent : null;
	}

	dispatchError() {
		this.listeners.get("error")?.();
	}
}

test("failed wrapped media is hidden and marked unavailable", () => {
	globalThis.HTMLImageElement = FakeImage;
	const image = new FakeImage();
	const media = {
		attributes: new Map(),
		setAttribute(name, value) {
			this.attributes.set(name, value);
		},
	};
	image.parent = media;
	const root = {
		querySelectorAll(selector) {
			assert.equal(selector, "[data-media-fallback] img, img[data-media-fallback]");
			return [image];
		},
	};

	initializeMediaFallback(/** @type {any} */ (root));
	image.dispatchError();

	assert.equal(image.hidden, true);
	assert.equal(image.attributes.get("aria-hidden"), "true");
	assert.equal(media.attributes.get("data-media-state"), "error");
});

test("failed direct media is hidden without requiring a wrapper", () => {
	globalThis.HTMLImageElement = FakeImage;
	const image = new FakeImage();
	const root = { querySelectorAll: () => [image] };

	initializeMediaFallback(/** @type {any} */ (root));
	image.dispatchError();

	assert.equal(image.hidden, true);
	assert.equal(image.attributes.get("aria-hidden"), "true");
});
