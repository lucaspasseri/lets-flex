import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import ejs from "ejs";

const templatePath = path.resolve(
	"views/partials/libraryPage/sessionWorkspace/sessionSummaries.ejs",
);

const baseItem = {
	id: 4,
	href: "/library?sessionId=4",
	isCurrent: false,
	name: "Lower strength",
	description: "A focused session.",
	stepCountLabel: "1 exercise",
	setCountLabel: "3 sets",
	movementPatternsLabel: "Squat",
	filters: { movement: ["Squat"], muscle: [], equipment: [] },
	searchKeyWord: "Lower strength Squat",
};

test("session summaries render resolved images and keep initial fallbacks", async () => {
	const html = await ejs.renderFile(templatePath, {
		summaries: {
			id: "session-summaries",
			heading: "Sessions",
			countLabel: "1 session",
			items: [
				{
					...baseItem,
					media: {
						src: "/media/uploads/squat.png",
						alt: "Squat illustration",
						width: 1536,
						height: 1024,
						presentation: "image",
					},
				},
			],
		},
	});

	assert.match(html, /src="\/media\/uploads\/squat\.png"/);
	assert.match(html, /session-summary__media media-frame media-frame--thumbnail/);
	assert.match(html, /loading="lazy"/);

	const fallbackHtml = await ejs.renderFile(templatePath, {
		summaries: {
			id: "session-summaries",
			heading: "Sessions",
			countLabel: "1 session",
			items: [
				{
					...baseItem,
					media: {
						src: null,
						alt: "Lower strength — initial tile",
						initial: "L",
						presentation: "initial",
					},
				},
			],
		},
	});

	assert.match(fallbackHtml, /data-media-presentation="initial"/);
	assert.match(fallbackHtml, />L<\/span>/);
	assert.doesNotMatch(fallbackHtml, /<img/);
});
