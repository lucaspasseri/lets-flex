const FALLBACK_MESSAGE =
	"Visual chart unavailable. Complete weekly data remains available below.";

/** @param {HTMLElement} root @param {string} key */
function parseSeries(root, key) {
	const value = root.dataset[key];
	if (!value) return [];
	const parsed = JSON.parse(value);
	if (!Array.isArray(parsed)) throw new Error("Invalid chart series");
	return parsed;
}

/** @param {HTMLElement} root @param {HTMLCanvasElement} canvas @param {HTMLElement} container @param {HTMLElement} status */
function showFallback(root, canvas, container, status) {
	root.dataset.chartState = "unavailable";
	canvas.hidden = true;
	container.hidden = true;
	status.hidden = false;
	status.textContent = FALLBACK_MESSAGE;
}

/**
 * Enhances the server-rendered adherence summary. Failure leaves the complete HTML data
 * available and does not expose provider or implementation details.
 *
 * @param {HTMLElement} root
 * @param {{ChartConstructor?: any, readColor?: (name: string) => string, reducedMotion?: boolean}} [options]
 */
export function initializeAdherenceChart(root, options = {}) {
	const canvas = /** @type {HTMLCanvasElement | null} */ (
		root.querySelector("[data-adherence-chart-canvas]")
	);
	const status = /** @type {HTMLElement | null} */ (
		root.querySelector("[data-chart-status]")
	);
	const container = /** @type {HTMLElement | null} */ (
		root.querySelector("[data-adherence-chart-container]")
	);
	if (!canvas || !container || !status) return null;

	root.dataset.chartState = "loading";
	status.hidden = false;
	status.textContent = "Preparing visual chart… Weekly data is available below.";

	const ChartConstructor = Object.hasOwn(options, "ChartConstructor")
		? options.ChartConstructor
		: globalThis.Chart;
	if (typeof ChartConstructor !== "function") {
		showFallback(root, canvas, container, status);
		return null;
	}

	try {
		const labels = parseSeries(root, "chartLabels");
		const scheduled = parseSeries(root, "chartScheduled");
		const finished = parseSeries(root, "chartFinished");
		const cancelled = parseSeries(root, "chartCancelled");
		if (
			labels.length === 0 ||
			![scheduled, finished, cancelled].every(
				(series) =>
					series.length === labels.length &&
					series.every((value) => Number.isFinite(Number(value))),
			)
		) {
			throw new Error("Incomplete chart series");
		}

		const readColor =
			options.readColor ??
			((name) =>
				getComputedStyle(document.documentElement).getPropertyValue(name).trim());
		const textColor = readColor("--color-text-muted") || "#9ca3af";
		const borderColor = readColor("--color-border") || "#2a2d34";
		const actionColor = readColor("--color-action") || "#ffb4ac";
		const successColor = readColor("--color-success") || "#2ec4b6";
		const dangerColor = readColor("--color-danger") || "#e63946";
		const reducedMotion =
			options.reducedMotion ??
			globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
			false;

		const chart = new ChartConstructor(canvas, {
			type: "bar",
			data: {
				labels,
				datasets: [
					{
						label: "Scheduled",
						data: scheduled,
						backgroundColor: "transparent",
						borderColor: actionColor,
						borderWidth: 2,
						borderRadius: 7,
						borderSkipped: false,
					},
					{
						label: "Finished",
						data: finished,
						backgroundColor: successColor,
						borderColor: successColor,
						borderWidth: 1,
						borderRadius: 7,
					},
					{
						label: "Cancelled",
						data: cancelled,
						backgroundColor: "transparent",
						borderColor: dangerColor,
						borderWidth: 2,
						borderRadius: 0,
						borderSkipped: false,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: reducedMotion ? false : { duration: 320 },
				plugins: { legend: { display: false } },
				interaction: { mode: "index", intersect: false },
				scales: {
					x: {
						grid: { display: false },
						ticks: { color: textColor },
					},
					y: {
						beginAtZero: true,
						grid: { color: borderColor },
						ticks: { color: textColor, precision: 0, stepSize: 1 },
					},
				},
			},
		});

		canvas.hidden = false;
		container.hidden = false;
		status.hidden = true;
		root.dataset.chartState = "ready";
		return chart;
	} catch {
		showFallback(root, canvas, container, status);
		return null;
	}
}
