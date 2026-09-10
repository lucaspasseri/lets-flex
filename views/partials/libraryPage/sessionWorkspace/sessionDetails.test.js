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
