import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
	initializeWorkoutLogForm,
	initializeWorkoutTracker,
} from "./workoutTracker.js";

class FakeElement {
	constructor(attributes = {}) {
		this.attributes = new Map(Object.entries(attributes));
		this.dataset = {};
		this.disabled = false;
		this.listeners = new Map();
		this.textContent = "";
		this.focused = false;
	}

	addEventListener(type, listener) {
		this.listeners.set(type, listener);
	}

	dispatch(type, event = {}) {
		this.listeners.get(type)?.({ target: this, ...event });
	}

	setAttribute(name, value) {
		this.attributes.set(name, String(value));
	}

	getAttribute(name) {
		return this.attributes.get(name) ?? null;
	}

	focus() {
		this.focused = true;
	}
}

function createRow(context) {
	const title = new FakeElement();
	const input = new FakeElement({
		id: `logFormRows[${context}]_performedReps`,
		name: `logFormRows[${context}][performedReps]`,
		"aria-describedby": `logFormRows[${context}]_performedReps-error`,
	});
	const label = new FakeElement({
		for: `logFormRows[${context}]_performedReps`,
	});
	const error = new FakeElement({
		id: `logFormRows[${context}]_performedReps-error`,
	});
	const removeButton = new FakeElement({ "data-action": "remove-set" });
	const row = new FakeElement({ "data-set-row": "" });
	row.reindexElements = [input, label, error];
	row.querySelector = (selector) =>
		({
			"[data-set-title]": title,
			'[data-action="remove-set"]': removeButton,
			".form-input, .form-select": input,
		})[selector] ?? null;
	row.querySelectorAll = () => row.reindexElements;
	row.remove = () => {
		const index = row.parent.rows.indexOf(row);
		if (index >= 0) row.parent.rows.splice(index, 1);
	};
	removeButton.closest = (selector) =>
		selector === '[data-action="remove-set"]'
			? removeButton
			: selector === "[data-set-row]"
				? row
				: null;
	return { row, title, input, removeButton };
}

function createLogFormHarness({ maxSets = 3 } = {}) {
	const initial = createRow("0");
	const setList = new FakeElement();
	setList.rows = [initial.row];
	initial.row.parent = setList;
	setList.querySelectorAll = () => setList.rows;
	setList.append = (row) => {
		row.parent = setList;
		setList.rows.push(row);
	};

	const form = new FakeElement();
	const addButton = new FakeElement();
	const count = new FakeElement();
	const announcement = new FakeElement();
	const template = {
		content: {
			cloneNode() {
				return createRow("template").row;
			},
		},
	};
	const root = new FakeElement();
	root.dataset.maxSets = String(maxSets);
	root.querySelector = (selector) =>
		({
			"[data-workout-perform-form]": form,
			"[data-set-list]": setList,
			"[data-set-row-template]": template,
			'[data-action="add-set"]': addButton,
			"[data-set-count]": count,
			"[data-set-announcement]": announcement,
		})[selector] ?? null;

	return { root, setList, addButton, count, announcement, initial };
}

test("set controls preserve one row, reindex additions, enforce the limit, and manage focus", () => {
	const { root, setList, addButton, count, announcement, initial } =
		createLogFormHarness();
	initializeWorkoutLogForm(root);

	assert.equal(initial.removeButton.disabled, true);
	assert.equal(count.textContent, "1 set ready");

	addButton.dispatch("click");
	assert.equal(setList.rows.length, 2);
	assert.equal(
		setList.rows[1].reindexElements[0].getAttribute("name"),
		"logFormRows[1][performedReps]",
	);
	assert.equal(
		setList.rows[1].reindexElements[1].getAttribute("for"),
		"logFormRows[1]_performedReps",
	);
	assert.equal(setList.rows[1].reindexElements[0].focused, true);
	assert.equal(announcement.textContent, "Set 2 added.");

	addButton.dispatch("click");
	assert.equal(setList.rows.length, 3);
	assert.equal(addButton.disabled, true);
	addButton.dispatch("click");
	assert.equal(setList.rows.length, 3);

	const middleRemove = setList.rows[1].querySelector('[data-action="remove-set"]');
	setList.dispatch("click", { target: middleRemove });
	assert.equal(setList.rows.length, 2);
	assert.equal(setList.rows[1].querySelector("[data-set-title]").textContent, "Set 2");
	assert.equal(
		setList.rows[1].querySelector('[data-action="remove-set"]').focused,
		true,
	);
	assert.equal(announcement.textContent, "Set 2 removed. 2 sets remain.");
});

test("workout tracker focuses feedback and exposes submission loading state", () => {
	const feedback = new FakeElement();
	const form = new FakeElement();
	const button = new FakeElement();
	button.dataset.loadingLabel = "Finishing…";
	const label = new FakeElement();
	button.querySelector = () => label;
	form.querySelector = () => button;
	const root = {
		querySelector(selector) {
			return selector === "[data-workout-feedback]" ? feedback : null;
		},
		querySelectorAll(selector) {
			if (selector === "[data-workout-log-form]") return [];
			if (selector === "[data-workout-action-form], [data-workout-perform-form]") {
				return [form];
			}
			return [];
		},
	};

	initializeWorkoutTracker(root);
	form.dispatch("submit", { submitter: button });

	assert.equal(feedback.focused, true);
	assert.equal(button.disabled, true);
	assert.equal(button.getAttribute("aria-disabled"), "true");
	assert.equal(label.textContent, "Finishing…");
});

test("workout styles include responsive, focus, target-size, and reduced-motion rules", () => {
	const css = fs.readFileSync(
		new URL("../../../css/components/sessionComponent.css", import.meta.url),
		"utf8",
	);
	assert.match(css, /@media \(max-width: 46rem\)/);
	assert.match(css, /@media \(max-width: 32rem\)/);
	assert.match(css, /min-height: 2\.75rem/);
	assert.match(css, /\.workout-feedback:focus-visible/);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
