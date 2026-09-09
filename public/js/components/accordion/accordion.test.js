import assert from "node:assert/strict";
import test from "node:test";

import createAccordion from "./accordion.js";

function createHarness({ panelHidden = true } = {}) {
	const triggerListeners = new Map();
	const panelListeners = new Map();
	const attributes = new Map();
	const classes = new Set(panelHidden ? ["collapsed"] : []);
	let fallback = null;

	const trigger = {
		addEventListener(type, listener) {
			triggerListeners.set(type, listener);
		},
		setAttribute(name, value) {
			attributes.set(name, value);
		},
	};
	const panel = {
		hidden: panelHidden,
		addEventListener(type, listener) {
			panelListeners.set(type, listener);
		},
	};
	const root = {
		classList: {
			add(name) {
				classes.add(name);
			},
			remove(name) {
				classes.delete(name);
			},
		},
		querySelector(selector) {
			return selector === "[data-accordion-header]" ? trigger : panel;
		},
	};

	createAccordion(/** @type {any} */ (root), {
		schedule: /** @type {any} */ (
			(callback) => {
				fallback = callback;
				return 1;
			}
		),
		cancel: /** @type {any} */ (() => {}),
	});

	return {
		attributes,
		classes,
		panel,
		click: () => triggerListeners.get("click")?.(),
		endTransition: () =>
			panelListeners.get("transitionend")?.({
				target: panel,
				propertyName: "grid-template-rows",
			}),
		runFallback: () => fallback?.(),
	};
}

test("accordion exposes synchronized expanded and hidden states", () => {
	const accordion = createHarness();

	assert.equal(accordion.attributes.get("aria-expanded"), "false");
	accordion.click();
	assert.equal(accordion.panel.hidden, false);
	assert.equal(accordion.classes.has("collapsed"), false);
	assert.equal(accordion.attributes.get("aria-expanded"), "true");

	accordion.endTransition();
	accordion.click();
	assert.equal(accordion.panel.hidden, false);
	assert.equal(accordion.classes.has("collapsed"), true);
	assert.equal(accordion.attributes.get("aria-expanded"), "false");
	accordion.endTransition();
	assert.equal(accordion.panel.hidden, true);
});

test("accordion completes without relying on a transition event", () => {
	const accordion = createHarness({ panelHidden: false });

	assert.equal(accordion.attributes.get("aria-expanded"), "true");
	accordion.click();
	assert.equal(accordion.panel.hidden, false);
	accordion.runFallback();
	assert.equal(accordion.panel.hidden, true);

	accordion.click();
	assert.equal(accordion.panel.hidden, false);
	assert.equal(accordion.attributes.get("aria-expanded"), "true");
});
