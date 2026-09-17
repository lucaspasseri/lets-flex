import assert from "node:assert/strict";
import test from "node:test";
import ejs from "ejs";
import path from "node:path";

const templatePath = path.resolve(
	"views/partials/libraryPage/exerciseTemplateSummary.ejs",
);

const summary = {
	variantCountLabel: "3 variants",
	movementPatternLabel: "Horizontal push",
	equipmentSummary: "Barbell · Dumbbell",
};

test("exercise summary keeps the compact media and exercise-specific identity together", async () => {
	const html = await ejs.renderFile(templatePath, {
		t: (_key, options) => options.defaultValue,
		template: {
			baseName: "A long exercise name that remains readable at narrow widths",
			summary,
			details: {
				media: {
					src: "/media/catalog/exercises/press.png",
					width: 960,
					height: 640,
					alt: "Press",
					presentation: "image",
				},
			},
		},
	});

	assert.match(html, /exercise-template__summary-body/);
	assert.match(
		html,
		/exercise-template__summary-media media-frame media-frame--icon media-frame--compact/,
	);
	assert.match(html, /src="\/media\/catalog\/exercises\/press\.png"/);
	assert.match(html, /A long exercise name that remains readable at narrow widths/);
	assert.match(html, /3 variants/);
	assert.match(html, /Horizontal push[\s\S]*Barbell · Dumbbell/);
});

test("exercise summary preserves the shared initial fallback presentation", async () => {
	const html = await ejs.renderFile(templatePath, {
		t: (_key, options) => options.defaultValue,
		template: {
			baseName: "Unlisted exercise",
			summary: {
				...summary,
				variantCountLabel: "1 variant",
			},
			details: {
				media: {
					src: null,
					alt: "Unlisted exercise — initial tile",
					initial: "U",
					presentation: "initial",
				},
			},
		},
	});

	assert.match(html, /data-media-presentation="initial"/);
	assert.match(html, /media-frame--initial media-frame--icon media-frame--compact/);
	assert.match(html, />U<\/span>/);
	assert.doesNotMatch(html, /<img/);
});
