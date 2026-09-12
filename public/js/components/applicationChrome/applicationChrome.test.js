import test from "node:test";
import assert from "node:assert/strict";

import createApplicationChrome from "./applicationChrome.js";

const originalGlobals = {
	HTMLElement: globalThis.HTMLElement,
	HTMLButtonElement: globalThis.HTMLButtonElement,
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
		this.attributes = new Map();
		this.classList = new FakeClassList();
		this.isConnected = true;
		this.listeners = new Map();
		this.ownerDocument = null;
		this.parent = null;
	}

	addEventListener(type, listener) {
		const listeners = this.listeners.get(type) ?? [];
		listeners.push(listener);
		this.listeners.set(type, listeners);
	}

	dispatch(type, properties = {}) {
		const event = {
			target: this,
			defaultPrevented: false,
			preventDefault() {
				this.defaultPrevented = true;
			},
			...properties,
		};

		for (const listener of this.listeners.get(type) ?? []) listener(event);

		return event;
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
		if (selector !== "[hidden], [inert]") return null;

		let element = this;
		while (element) {
			if (element.hasAttribute("hidden") || element.hasAttribute("inert")) {
				return element;
			}
			element = element.parent;
		}

		return null;
	}

	getClientRects() {
		return [{}];
	}

	focus() {
		this.ownerDocument.activeElement = this;
	}
}

class FakeButtonElement extends FakeElement {}

class FakeMediaQuery {
	constructor(matches = false) {
		this.matches = matches;
		this.listeners = [];
	}

	addEventListener(type, listener) {
		if (type === "change") this.listeners.push(listener);
	}

	setMatches(matches) {
		this.matches = matches;
		for (const listener of this.listeners) listener({ matches });
	}
}

function createHarness({ desktop = false, contentInert = false, labels = {} } = {}) {
	globalThis.HTMLElement = FakeElement;
	globalThis.HTMLButtonElement = FakeButtonElement;

	const root = new FakeElement();
	const toggle = new FakeButtonElement();
	const menu = new FakeElement();
	const content = new FakeElement();
	const body = new FakeElement();
	const links = [new FakeElement(), new FakeElement(), new FakeElement()];
	const mediaQuery = new FakeMediaQuery(desktop);
	const resizeListeners = [];
	const documentRef = {
		activeElement: toggle,
		body,
		defaultView: {
			addEventListener(type, listener) {
				if (type === "resize") resizeListeners.push(listener);
			},
		},
		querySelector(selector) {
			return selector === "[data-page-content]" ? content : null;
		},
	};

	for (const element of [root, toggle, menu, content, body, ...links]) {
		element.ownerDocument = documentRef;
	}
	for (const link of links) link.parent = menu;

	if (contentInert) content.setAttribute("inert", "");
	menu.setAttribute("inert", "");
	menu.setAttribute("aria-hidden", "true");
	toggle.setAttribute("aria-expanded", "false");
	toggle.setAttribute("aria-label", "Open navigation menu");
	if (labels.open) toggle.setAttribute("data-open-label", labels.open);
	if (labels.close) toggle.setAttribute("data-close-label", labels.close);

	root.querySelector = (selector) => {
		if (selector === "[data-application-menu-toggle]") return toggle;
		if (selector === "[data-application-menu]") return menu;
		return null;
	};
	menu.querySelectorAll = (selector) =>
		selector === "[data-application-navigation-link]" || selector.includes("a[href]")
			? links
			: [];

	const chrome = createApplicationChrome(/** @type {any} */ (root), {
		mediaQuery: /** @type {any} */ (mediaQuery),
	});

	return {
		root,
		toggle,
		menu,
		content,
		body,
		links,
		mediaQuery,
		documentRef,
		resizeListeners,
		chrome,
	};
}

test("mobile menu synchronizes visual, accessibility, and background state", () => {
	const { root, toggle, menu, content, body, links, documentRef, chrome } =
		createHarness();

	assert.equal(chrome.isOpen, false);
	assert.equal(menu.hasAttribute("inert"), true);
	assert.equal(menu.getAttribute("aria-hidden"), "true");

	toggle.dispatch("click");

	assert.equal(chrome.isOpen, true);
	assert.equal(root.classList.contains("is-menu-open"), true);
	assert.equal(menu.classList.contains("is-open"), true);
	assert.equal(menu.hasAttribute("inert"), false);
	assert.equal(menu.getAttribute("aria-hidden"), "false");
	assert.equal(toggle.getAttribute("aria-expanded"), "true");
	assert.equal(toggle.getAttribute("aria-label"), "Close navigation menu");
	assert.equal(content.hasAttribute("inert"), true);
	assert.equal(body.classList.contains("has-open-navigation"), true);
	assert.equal(documentRef.activeElement, links[0]);
});

test("mobile menu uses locale-specific labels for both toggle states", () => {
	const { toggle, chrome } = createHarness({
		labels: {
			open: "Abrir menu de navegação",
			close: "Fechar menu de navegação",
		},
	});

	toggle.dispatch("click");
	assert.equal(toggle.getAttribute("aria-label"), "Fechar menu de navegação");
	toggle.dispatch("click");
	assert.equal(toggle.getAttribute("aria-label"), "Abrir menu de navegação");
	assert.equal(chrome.isOpen, false);
});

test("Escape closes the menu, unlocks content, and restores trigger focus", () => {
	const { root, toggle, menu, content, body, chrome, documentRef } = createHarness();
	documentRef.activeElement = body;
	toggle.dispatch("click");

	const event = root.dispatch("keydown", { key: "Escape" });

	assert.equal(event.defaultPrevented, true);
	assert.equal(chrome.isOpen, false);
	assert.equal(menu.hasAttribute("inert"), true);
	assert.equal(menu.getAttribute("aria-hidden"), "true");
	assert.equal(toggle.getAttribute("aria-expanded"), "false");
	assert.equal(toggle.getAttribute("aria-label"), "Open navigation menu");
	assert.equal(content.hasAttribute("inert"), false);
	assert.equal(body.classList.contains("has-open-navigation"), false);
	assert.equal(documentRef.activeElement, toggle);
});

test("destination activation closes without stealing focus before navigation", () => {
	const { toggle, menu, links, content, body, chrome, documentRef } = createHarness();
	toggle.dispatch("click");
	documentRef.activeElement = links[1];

	links[1].dispatch("click");

	assert.equal(chrome.isOpen, false);
	assert.equal(menu.hasAttribute("inert"), true);
	assert.equal(content.hasAttribute("inert"), false);
	assert.equal(body.classList.contains("has-open-navigation"), false);
	assert.equal(documentRef.activeElement, links[1]);
});

test("open menu contains keyboard focus across its boundaries", () => {
	const { root, toggle, links, documentRef } = createHarness();
	toggle.dispatch("click");
	documentRef.activeElement = links.at(-1);

	const forwardEvent = root.dispatch("keydown", { key: "Tab", shiftKey: false });
	assert.equal(forwardEvent.defaultPrevented, true);
	assert.equal(documentRef.activeElement, toggle);

	const backwardEvent = root.dispatch("keydown", { key: "Tab", shiftKey: true });
	assert.equal(backwardEvent.defaultPrevented, true);
	assert.equal(documentRef.activeElement, links.at(-1));
});

test("breakpoint changes normalize the menu for desktop and mobile", () => {
	const { toggle, menu, content, body, mediaQuery, chrome } = createHarness();
	toggle.dispatch("click");

	mediaQuery.setMatches(true);

	assert.equal(chrome.isOpen, false);
	assert.equal(menu.hasAttribute("inert"), false);
	assert.equal(menu.hasAttribute("aria-hidden"), false);
	assert.equal(content.hasAttribute("inert"), false);
	assert.equal(body.classList.contains("has-open-navigation"), false);

	mediaQuery.setMatches(false);

	assert.equal(menu.hasAttribute("inert"), true);
	assert.equal(menu.getAttribute("aria-hidden"), "true");
	assert.equal(toggle.getAttribute("aria-expanded"), "false");
});

test("window resize also normalizes state when media-query events are delayed", () => {
	const { toggle, menu, content, body, mediaQuery, resizeListeners, chrome } =
		createHarness();
	toggle.dispatch("click");
	mediaQuery.matches = true;

	resizeListeners[0]();

	assert.equal(chrome.isOpen, false);
	assert.equal(menu.hasAttribute("inert"), false);
	assert.equal(menu.hasAttribute("aria-hidden"), false);
	assert.equal(content.hasAttribute("inert"), false);
	assert.equal(body.classList.contains("has-open-navigation"), false);
});

test("menu cleanup does not remove inertness owned by another overlay", () => {
	const { toggle, content, body } = createHarness({ contentInert: true });
	toggle.dispatch("click");
	toggle.dispatch("click");
	assert.equal(content.hasAttribute("inert"), true);

	content.removeAttribute("inert");
	toggle.dispatch("click");
	body.classList.add("has-open-modal");
	toggle.dispatch("click");
	assert.equal(content.hasAttribute("inert"), true);
});
