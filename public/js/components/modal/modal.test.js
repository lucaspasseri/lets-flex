import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import createModal from "./modal.js";

const originalGlobals = {
	HTMLElement: globalThis.HTMLElement,
	document: globalThis.document,
	window: globalThis.window,
	requestAnimationFrame: globalThis.requestAnimationFrame,
	getComputedStyle: globalThis.getComputedStyle,
};

test.afterEach(() => {
	for (const [name, value] of Object.entries(originalGlobals)) {
		if (value === undefined) delete globalThis[name];
		else globalThis[name] = value;
	}
});

class FakeClassList {
	items = new Set();

	add(name) {
		this.items.add(name);
	}

	remove(name) {
		this.items.delete(name);
	}

	contains(name) {
		return this.items.has(name);
	}
}

class FakeElement {
	constructor() {
		this.hidden = false;
		this.id = "";
		this.isConnected = true;
		this.attributes = new Map();
		this.classList = new FakeClassList();
		this.listeners = new Map();
		this.style = {};
	}

	addEventListener(type, listener) {
		const listeners = this.listeners.get(type) ?? [];
		listeners.push(listener);
		this.listeners.set(type, listeners);
	}

	removeEventListener(type, listener) {
		this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item !== listener));
	}

	dispatch(type, event = {}) {
		for (const listener of this.listeners.get(type) ?? []) {
			listener({ target: this, preventDefault() {}, ...event });
		}
	}

	setAttribute(name, value) {
		this.attributes.set(name, value);
	}

	removeAttribute(name) {
		this.attributes.delete(name);
	}

	hasAttribute(name) {
		return this.attributes.has(name);
	}

	getAttribute(name) {
		return this.attributes.get(name) ?? null;
	}

	closest(selector) {
		if (selector === "[hidden], [inert]") {
			return this.hidden || this.hasAttribute("inert") ? this : null;
		}
		return null;
	}

	getClientRects() {
		return [{}];
	}

	focus() {
		globalThis.document.activeElement = this;
	}
}

function createHarness() {
	const root = new FakeElement();
	const backdrop = new FakeElement();
	const content = new FakeElement();
	const closeButton = new FakeElement();
	const openButton = new FakeElement();
	const pageContent = new FakeElement();
	const body = new FakeElement();
	const scrollCalls = [];

	root.id = "test-modal";
	root.hidden = true;
	root.querySelector = selector => ({
		"[data-modal-backdrop]": backdrop,
		"[data-modal-content]": content,
		"[data-modal-close-button]": closeButton,
	})[selector] ?? null;
	root.querySelectorAll = () => [closeButton];
	pageContent.contains = () => false;

	globalThis.HTMLElement = FakeElement;
	globalThis.document = {
		activeElement: openButton,
		body,
		querySelector(selector) {
			if (selector === "[data-page-content]") return pageContent;
			if (selector === '[data-modal-close="test-modal"]') return null;
			return null;
		},
		querySelectorAll(selector) {
			return selector === '[data-modal-open="test-modal"]' ? [openButton] : [];
		},
	};
	globalThis.window = {
		scrollY: 240,
		scrollTo(x, y) {
			scrollCalls.push([x, y]);
		},
	};
	globalThis.requestAnimationFrame = callback => callback();
	globalThis.getComputedStyle = () => ({ transitionDuration: "0s", transitionDelay: "0s" });

	return { root, backdrop, content, closeButton, openButton, pageContent, body, scrollCalls };
}

const settleTransition = () => Promise.resolve();

test("a closed modal is removed from layout and does not restrict the page", () => {
	const css = fs.readFileSync(new URL("../../../css/components/modal.css", import.meta.url), "utf8");
	const { root, pageContent, body } = createHarness();
	createModal(root);

	assert.match(css, /\.modal\[hidden\]\s*{\s*display:\s*none;/);
	assert.equal(root.hidden, true);
	assert.equal(pageContent.hasAttribute("inert"), false);
	assert.equal(body.classList.contains("has-open-modal"), false);
	assert.equal(body.style.top, undefined);
});

test("opening activates the backdrop and restricts background interaction", async () => {
	const { root, backdrop, content, openButton, pageContent, body } = createHarness();
	createModal(root);

	openButton.dispatch("click");
	await settleTransition();

	assert.equal(root.hidden, false);
	assert.equal(backdrop.classList.contains("is-open"), true);
	assert.equal(content.classList.contains("is-open"), true);
	assert.equal(pageContent.hasAttribute("inert"), true);
	assert.equal(body.classList.contains("has-open-modal"), true);
	assert.equal(body.style.top, "-240px");
});

test("closing restores page interaction, scroll position, and focus", async () => {
	const { root, backdrop, openButton, closeButton, pageContent, body, scrollCalls } = createHarness();
	createModal(root);

	openButton.dispatch("click");
	await settleTransition();
	closeButton.dispatch("click");
	await settleTransition();

	assert.equal(root.hidden, true);
	assert.equal(backdrop.classList.contains("is-open"), false);
	assert.equal(pageContent.hasAttribute("inert"), false);
	assert.equal(body.classList.contains("has-open-modal"), false);
	assert.equal(body.style.top, "");
	assert.deepEqual(scrollCalls, [[0, 240]]);
	assert.equal(globalThis.document.activeElement, openButton);
});

test("repeated open and close cycles leave modal and page state clean", async () => {
	const { root, backdrop, content, openButton, closeButton, pageContent, body, scrollCalls } = createHarness();
	createModal(root);

	for (let cycle = 0; cycle < 3; cycle += 1) {
		openButton.dispatch("click");
		await settleTransition();
		closeButton.dispatch("click");
		await settleTransition();
	}

	assert.equal(root.hidden, true);
	assert.equal(backdrop.classList.contains("is-open"), false);
	assert.equal(content.classList.contains("is-open"), false);
	assert.equal(pageContent.hasAttribute("inert"), false);
	assert.equal(body.classList.contains("has-open-modal"), false);
	assert.equal(scrollCalls.length, 3);
});
