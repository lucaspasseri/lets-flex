import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import ejs from "ejs";
import { toExerciseProgressKey } from "../src/features/exerciseProgress/mapper.js";
import {
	createExerciseProgressPageViewModel,
	createExerciseProgressStatePageViewModel,
} from "./viewModels/exerciseProgressPage/createExerciseProgressPageViewModel.js";

const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);
const indexPath = path.resolve("views/progress/index.ejs");
const statusPath = path.resolve("views/progress/status.ejs");
const user = /** @type {import("../src/features/users/users.types.js").User} */ ({
	id: 1,
	name: "Owner",
	email: "owner@example.com",
	role: "user",
	dateOfBirth: null,
	anamnesis: null,
});

test("progress page renders semantic filters and complete non-chart trend data safely", async () => {
	const choice = {
		key: toExerciseProgressKey("Squat <script>", "Back & squat"),
		exerciseName: "Squat <script>",
		exerciseVariantName: "Back & squat",
		occurrenceCount: 1,
		firstDate: "2026-09-01",
		lastDate: "2026-09-01",
	};
	const query = {
		programId: 4,
		exerciseKey: choice.key,
		fromDate: "2026-09-01",
		toDate: "2026-09-01",
		pointLimit: 100,
	};
	const progress = {
		programId: 4,
		selection: choice,
		filters: { fromDate: query.fromDate, toDate: query.toDate },
		summary: {
			occurrenceCount: 1,
			performedStepCount: 1,
			recordedSetCount: 2,
			setsWithRepetitionsCount: 2,
			completedRepetitionCount: 16,
			setsWithLoadCount: 2,
			setsWithVolumeCount: 2,
			units: [
				{
					unit: "Kilograms",
					loadObservationCount: 2,
					maximumLoad: 102.5,
					volumeSetCount: 2,
					volume: 1620,
				},
			],
		},
		occurrences: [
			{
				workoutSessionId: 11,
				dateKey: "2026-09-01",
				finishedAt: "2026-09-01T10:00:00.000Z",
				sessionName: "Lower <strong>day",
				performedStepCount: 1,
				recordedSetCount: 2,
				setsWithRepetitionsCount: 2,
				completedRepetitionCount: 16,
				setsWithLoadCount: 2,
				setsWithVolumeCount: 2,
				units: [
					{
						unit: "Kilograms",
						loadObservationCount: 2,
						maximumLoad: 102.5,
						volumeSetCount: 2,
						volume: 1620,
					},
				],
			},
		],
		series: [],
		totalOccurrenceCount: 1,
		returnedOccurrenceCount: 1,
		isTruncated: false,
		pointLimit: 100,
	};
	const view = createExerciseProgressPageViewModel({
		page: {},
		data: {
			currentUser: user,
			programs: [
				{
					id: 4,
					userId: 1,
					goalId: null,
					name: "Strength <unsafe>",
					startDate: "2026-01-01",
				},
			],
			choices: [choice],
			progress,
		},
		query,
	});
	const html = await renderFile(indexPath, view);

	assert.match(html, /<main class="main exercise-progress"/);
	assert.equal((html.match(/method="GET"/g) ?? []).length, 2);
	assert.match(html, /<label class="form-field__label" for="progress-program">/);
	assert.match(html, /<label class="form-field__label" for="progress-exercise">/);
	assert.match(html, /name="programId" value="4"/);
	assert.match(
		html,
		/<caption>Recorded exercise results by finished workout<\/caption>/,
	);
	assert.match(
		html,
		/class="exercise-progress-table-scroll" role="region" aria-label="Exercise progress workout table" tabindex="0"/,
	);
	assert.match(
		html,
		/class="exercise-progress-summary-card exercise-progress-summary-card--primary"/,
	);
	assert.match(html, /class="exercise-progress-coverage-list"/);
	assert.match(html, /class="exercise-progress-unit-card"/);
	assert.match(html, /<time datetime="2026-09-01">Sep 1, 2026<\/time>/);
	assert.match(html, /href="\/history\/11"/);
	assert.match(html, /102.5 Kilograms/);
	assert.match(html, /1,620 repetitions × Kilograms/);
	assert.match(html, /Squat &lt;script&gt; — Back &amp; squat/);
	assert.match(html, /Strength &lt;unsafe&gt;/);
	assert.match(html, /Lower &lt;strong&gt;day/);
	assert.doesNotMatch(html, /Squat <script>|Strength <unsafe>|Lower <strong>/);
	assert.doesNotMatch(html, /<canvas|<script/);
	assert.doesNotMatch(html, /method="POST"|method="PATCH"|method="DELETE"/);
});

test("progress page renders intentional selection and filtered-empty states", async () => {
	const baseQuery = {
		programId: null,
		exerciseKey: null,
		fromDate: null,
		toDate: null,
		pointLimit: 100,
	};
	const chooseProgram = createExerciseProgressPageViewModel({
		page: {},
		data: {
			currentUser: user,
			programs: [
				{
					id: 4,
					userId: 1,
					goalId: null,
					name: "Strength",
					startDate: "2026-01-01",
				},
			],
			choices: [],
			progress: null,
		},
		query: baseQuery,
	});
	const html = await renderFile(indexPath, chooseProgram);
	assert.match(html, /data-progress-state="choose-program"/);
	assert.match(html, /class="exercise-progress-state-mark" aria-hidden="true"/);
	assert.match(html, /Select a program to load exercises/);
	assert.doesNotMatch(html, /Recorded exercise results by finished workout/);
});

test("progress recovery page stays generic and links to a safe route", async () => {
	const view = createExerciseProgressStatePageViewModel({
		page: {},
		currentUser: user,
		state: "failure",
	});
	const html = await renderFile(statusPath, view);

	assert.match(html, /data-exercise-progress-state="failure"/);
	assert.match(html, /class="exercise-progress-state-card"/);
	assert.match(html, /class="exercise-progress-primary-action" href="\/progress"/);
	assert.match(html, /Progress could not be loaded/);
	assert.match(html, /workout data has not been changed/);
	assert.match(html, /href="\/progress"/);
	assert.doesNotMatch(html, /SELECT|snapshot\.|user-one@example/);
});
