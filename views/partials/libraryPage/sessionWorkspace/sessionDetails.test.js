import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import ejs from "ejs";

const templatePath = path.resolve(
	"views/partials/libraryPage/sessionWorkspace/sessionDetails.ejs",
);

test("selected-session detail renders orientation and presentation-ready prescription copy", async () => {
	const html = await ejs.renderFile(templatePath, {
		summariesHeadingId: "session-summaries-title",
		session: {
			id: 7,
			headingId: "session-details-title-7",
			media: {
				src: "/media/category-strength.svg",
				width: 960,
				height: 640,
				alt: "Strength session illustration",
				isFallback: true,
			},
			name: "Strength session",
			description: "A focused session.",
			notes: "Move with control.",
			isArchived: true,
			stats: [
				{ label: "Exercises", value: 1, icon: "dumbbell" },
				{ label: "Working sets", value: 3, icon: "layers" },
			],
			steps: [
				{
					order: 1,
					media: {
						src: "/media/exercise-bench-press.svg",
						width: 960,
						height: 640,
						alt: "Bench press illustration",
						isFallback: true,
					},
					type: "Exercise",
					exercise: {
						name: "Squat",
						variantName: "Bodyweight box squat",
						movementPattern: "Squat",
						equipment: "",
					},
					prescription: { label: "3 sets × 10 reps" },
					setupDescription: "Brace first.",
					notes: "Use a stable box.",
					muscles: [{ commonName: "Quads" }],
				},
			],
			actions: { edit: null, archive: null },
			stepNumber: 1,
		},
	});

	assert.match(
		html,
		/class="session-details__back-link" href="#session-summaries-title"/,
	);
	assert.match(html, /Selected session/);
	assert.match(html, /Archived/);
	assert.match(html, /3 sets × 10 reps/);
	assert.match(html, /session-details__media/);
	assert.match(html, /session-step__media/);
	assert.match(
		html,
		/class="session-step__header session-step__header--with-media"[\s\S]*?class="session-step__media"[\s\S]*?class="session-step__identity"/,
	);
	assert.match(html, /src="\/media\/exercise-bench-press\.svg"/);
	assert.match(html, /alt="Bench press illustration"/);
	assert.doesNotMatch(html, /Session template|null|undefined/);
});

test("empty session detail preserves its selection guidance without a return link", async () => {
	const html = await ejs.renderFile(templatePath, {
		summariesHeadingId: "session-summaries-title",
		session: null,
	});

	assert.match(html, /Select a session/);
	assert.match(html, /Choose a session to inspect its exercises and prescription/);
	assert.doesNotMatch(html, /session-details__back-link/);
});
