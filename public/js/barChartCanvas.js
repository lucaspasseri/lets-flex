const canvas = document.getElementById("bar-chart-canvas");

const canvasContainerElement = document.querySelector(".canvas-container");

const stringifyWeekArr =
	canvasContainerElement?.dataset?.barChartWeekArr ?? null;
const weekArr = stringifyWeekArr ? JSON.parse(stringifyWeekArr) : [];

const stringifyScheduledCountArr =
	canvasContainerElement?.dataset?.barChartScheduledCountArr ?? null;
const scheduledCountArr = stringifyScheduledCountArr
	? JSON.parse(stringifyScheduledCountArr)
	: [];

const stringifyFinishedCountArr =
	canvasContainerElement?.dataset?.barChartFinishedCountArr ?? null;
const finishedCountArr = stringifyFinishedCountArr
	? JSON.parse(stringifyFinishedCountArr)
	: [];

if (canvas) {
	const styles = getComputedStyle(document.documentElement);
	const textColor = styles.getPropertyValue("--color-text-muted").trim();
	const borderColor = styles.getPropertyValue("--color-border").trim();
	const actionColor = styles.getPropertyValue("--color-action").trim();
	const successColor = styles.getPropertyValue("--color-success").trim();

	new Chart(canvas, {
		type: "bar",
		data: {
			labels: weekArr,
			datasets: [
				{
					label: "Scheduled",
					data: scheduledCountArr,
					backgroundColor: actionColor,
					borderRadius: 6,
				},
				{
					label: "Finished",
					data: finishedCountArr,
					backgroundColor: successColor,
					borderRadius: 6,
				},
			],
		},
		options: {
			maintainAspectRatio: false,
			plugins: {
				legend: { labels: { color: textColor, usePointStyle: true } },
			},
			scales: {
				x: {
					grid: { display: false },
					ticks: { color: textColor },
				},
				y: {
					beginAtZero: true,
					grid: { color: borderColor },
					ticks: {
						color: textColor,
						precision: 0,
					},
				},
			},
		},
	});
}
