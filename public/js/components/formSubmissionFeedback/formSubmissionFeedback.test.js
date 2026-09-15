import assert from "node:assert/strict";
import test from "node:test";

import {
	initializeFormSubmissionFeedback,
	setFormSubmissionPending,
} from "./formSubmissionFeedback.js";

class FakeButton {
	dataset = {};
	disabled = false;
	textContent = "Save changes";
	attributes = new Map();
	style = {};

	setAttribute(name, value) {
		this.attributes.set(name, String(value));
	}

	getAttribute(name) {
		return this.attributes.get(name) ?? null;
	}

	querySelector() {
		return null;
	}

	getBoundingClientRect() {
		return { width: 128 };
	}
}

class FakeForm {
	dataset = {};
	attributes = new Map();
	listeners = new Map();
	button = new FakeButton();
	status = null;
	ownerDocument = {
		createElement: () => new FakeButton(),
	};

	addEventListener(type, listener) {
		this.listeners.set(type, listener);
	}

	querySelector(selector) {
		if (selector === "[data-submit-status]") return this.status;
		return selector.includes('[type="submit"]') ? this.button : null;
	}

	prepend(element) {
		this.status = element;
	}

	setAttribute(name, value) {
		this.attributes.set(name, String(value));
	}

	getAttribute(name) {
		return this.attributes.get(name) ?? null;
	}
}

test("pending submission disables only the initiating control and exposes busy state", () => {
	const form = new FakeForm();
	const button = form.button;
	button.dataset.pendingLabel = "Saving…";

	assert.equal(
		setFormSubmissionPending(form, button, () => "Submitting…"),
		true,
	);
	assert.equal(button.disabled, true);
	assert.equal(button.getAttribute("aria-disabled"), "true");
	assert.equal(button.getAttribute("data-submit-pending"), "true");
	assert.equal(button.textContent, "Saving…");
	assert.equal(form.dataset.submissionPending, "true");
	assert.equal(form.getAttribute("aria-busy"), "true");
	assert.equal(form.status.getAttribute("role"), "status");
	assert.equal(form.status.getAttribute("aria-live"), "polite");
	assert.equal(form.status.textContent, "Saving…");
	assert.equal(button.style.minInlineSize, "128px");

	assert.equal(
		setFormSubmissionPending(form, button, () => "Submitting…"),
		false,
	);
});

test("form handler blocks a second submission while preserving native first navigation", () => {
	const form = new FakeForm();
	const root = {
		querySelectorAll(selector) {
			return selector.includes("form[data-submit-feedback]") ? [form] : [];
		},
	};

	initializeFormSubmissionFeedback(root, () => "Submitting…");
	const listener = form.listeners.get("submit");
	let prevented = false;
	listener({ submitter: form.button, preventDefault() {} });
	assert.equal(form.button.disabled, true);
	listener({
		submitter: form.button,
		preventDefault() {
			prevented = true;
		},
	});
	assert.equal(prevented, true);
});

test("pending status can explain a long-running form action", () => {
	const form = new FakeForm();
	form.dataset.pendingMessage =
		"Generating a private candidate… This may take up to two minutes.";

	assert.equal(
		setFormSubmissionPending(form, form.button, () => "Submitting…"),
		true,
	);
	assert.equal(
		form.status.textContent,
		"Generating a private candidate… This may take up to two minutes.",
	);
});
