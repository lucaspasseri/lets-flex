import { initializeAdherenceChart } from "./adherenceChart.js";

export function initialize(root = document) {
	root
		.querySelectorAll("[data-adherence-chart]")
		.forEach((chart) => initializeAdherenceChart(/** @type {HTMLElement} */ (chart)));
}
