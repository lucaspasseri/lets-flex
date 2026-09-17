import assert from "node:assert/strict";
import test from "node:test";
import ejs from "ejs";
import path from "node:path";

const templatePath = path.resolve("views/partials/libraryPage/exerciseTemplates.ejs");

test("exercise templates reuse the Sessions master/detail composition", async () => {
	const html = await ejs.renderFile(templatePath, {
		t: (_key, options) => options.defaultValue,
		exerciseTemplates: {
			id: "exercise-templates",
			label: "Exercises available",
			countLabel: "1 exercise · 1 variant",
			discovery: {
				id: "exercise-discovery",
				title: "Find an exercise",
				description: "Search the exercise catalog.",
				searchLabel: "Search exercises",
				searchPlaceholder: "Search exercises",
				filters: [],
			},
			items: [
				{
					id: 7,
					searchKeyWord: "bench press",
					baseSearchKeyWord: "bench press",
					filters: {},
					variantCount: 1,
					summary: {
						variantCountLabel: "1 variant",
						movementPatternLabel: "Horizontal push",
						equipmentSummary: "Barbell",
					},
					details: {
						media: {
							src: null,
							alt: "Bench press — initial tile",
							initial: "B",
							presentation: "initial",
						},
						movementPattern: { name: "Horizontal push" },
						muscleTemplates: { groups: [], items: [] },
						variants: [],
					},
				},
			],
		},
	});

	const listIndex = html.indexOf(
		'class="session-summaries exercise-template__summaries"',
	);
	const detailsIndex = html.indexOf(
		'class="session-details exercise-template__details-panel"',
	);

	assert.match(html, /class="session-workspace__content exercise-template-workspace"/);
	assert.ok(listIndex >= 0 && detailsIndex > listIndex);
	assert.match(html, /data-exercise-details-id="exercise-template-7-details"/);
	assert.match(html, /id="exercise-template-7-details"/);
	assert.match(html, /aria-current="true"/);
	assert.doesNotMatch(html, /shared-accordion/);
});
