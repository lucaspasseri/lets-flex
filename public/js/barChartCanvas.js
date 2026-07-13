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
	new Chart(canvas, {
		type: "bar",
		data: {
			labels: weekArr,
			datasets: [
				{
					label: "Scheduled",
					data: scheduledCountArr,
					backgroundColor: "#60a5fa",
				},
				{
					label: "Finished",
					data: finishedCountArr,
					backgroundColor: "#22c55e",
				},
			],
		},
		options: {
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						precision: 0,
					},
				},
			},
		},
	});
}

function getStartOfWeek(year, week) {
	const options = {
		weekStartsOn: 1,
		firstWeekContainsDate: 4,
	};
	const referenceDate = new Date(year, 0, 1);
	const date = dateFns.setWeek(referenceDate, week, options);

	return dateFns.startOfWeek(date, options);
}
