import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { initializeAdherenceChart } from "./adherenceChart.js";

function createHarness(dataset = {}) {
	const canvas = { hidden: true };
	const container = { hidden: true };
	const status = { hidden: false, textContent: "" };
	const root = {
		dataset: {
			chartLabels: '["W1","W2"]',
			chartScheduled: "[3,2]",
			chartFinished: "[2,1]",
			chartCancelled: "[1,0]",
			...dataset,
		},
		querySelector(selector) {
			if (selector === "[data-adherence-chart-canvas]") return canvas;
			if (selector === "[data-adherence-chart-container]") return container;
			if (selector === "[data-chart-status]") return status;
			return null;
		},
	};
	return { root, canvas, container, status };
}

test("adherence chart progressively enhances complete server-rendered series", () => {
	const calls = [];
	class FakeChart {
		constructor(canvas, config) {
			calls.push({ canvas, config });
		}
	}
	const { root, canvas, container, status } = createHarness();

	const chart = initializeAdherenceChart(/** @type {any} */ (root), {
		ChartConstructor: FakeChart,
		readColor: (name) => name,
		reducedMotion: true,
	});

	assert.ok(chart instanceof FakeChart);
	assert.equal(root.dataset.chartState, "ready");
	assert.equal(canvas.hidden, false);
	assert.equal(container.hidden, false);
	assert.equal(status.hidden, true);
	assert.equal(calls.length, 1);
	assert.deepEqual(
		calls[0].config.data.datasets.map((dataset) => ({
			label: dataset.label,
			data: dataset.data,
			borderRadius: dataset.borderRadius,
		})),
		[
			{ label: "Scheduled", data: [3, 2], borderRadius: 7 },
			{ label: "Finished", data: [2, 1], borderRadius: 7 },
			{ label: "Cancelled", data: [1, 0], borderRadius: 0 },
		],
	);
	assert.equal(calls[0].config.options.animation, false);
	assert.equal(calls[0].config.options.plugins.legend.display, false);
	assert.equal(
		calls[0].config.options.plugins.tooltip.callbacks.label({
			dataset: { label: "Scheduled" },
			raw: 1234,
		}),
		"Scheduled: 1,234",
	);
});

test("adherence data remains available when Chart.js is missing or series are invalid", () => {
	for (const options of [
		{ dataset: {}, ChartConstructor: null },
		{
			dataset: { chartFinished: "not-json" },
			ChartConstructor: class FakeChart {},
		},
		{
			dataset: { chartCancelled: "[0]" },
			ChartConstructor: class FakeChart {},
		},
	]) {
		const { root, canvas, container, status } = createHarness(options.dataset);
		assert.equal(
			initializeAdherenceChart(/** @type {any} */ (root), {
				ChartConstructor: options.ChartConstructor,
			}),
			null,
		);
		assert.equal(root.dataset.chartState, "unavailable");
		assert.equal(canvas.hidden, true);
		assert.equal(container.hidden, true);
		assert.equal(status.hidden, false);
		assert.equal(
			status.textContent,
			"Visual chart unavailable. Complete weekly data remains available below.",
		);
	}
});

test("analytics styles include responsive, focus, target-size, and non-color cues", () => {
	const css = fs.readFileSync(
		new URL("../../../css/pages/dashboard.css", import.meta.url),
		"utf8",
	);

	assert.match(css, /@container application-content \(max-width: 62rem\)/);
	assert.match(css, /@container application-content \(max-width: 44rem\)/);
	assert.match(css, /@container application-content \(max-width: 34rem\)/);
	assert.match(css, /\.analytics-data-disclosure > summary[\s\S]*min-height: 2\.75rem/);
	assert.match(css, /\.analytics-data-disclosure > summary:focus-visible/);
	assert.match(css, /\.adherence-chart__status\[hidden\]\s*\{\s*display: none;/);
	assert.match(css, /\.dashboard-heatmap__cell--many[\s\S]*repeating-linear-gradient/);
	assert.match(css, /\.analytics-legend__marker--cancelled::after[\s\S]*content: "×"/);
	assert.match(css, /\.analytics-data-disclosure\s*\{[\s\S]*min-width: 0/);
	assert.match(css, /\.analytics-table-scroll[\s\S]*overflow-x: auto/);
	assert.match(css, /\.analytics-table-scroll\s*\{[\s\S]*min-width: 0/);
});
