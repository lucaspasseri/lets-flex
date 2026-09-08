import assert from "node:assert/strict";
import test from "node:test";
import getExerciseProgress, {
	MAX_EXERCISE_PROGRESS_POINT_LIMIT,
} from "./getExerciseProgress.js";
import getExerciseProgressChoices from "./getExerciseProgressChoices.js";
import { fromExerciseProgressKey, toExerciseProgressKey } from "./mapper.js";

test("exercise choices use owned finished snapshots and canonical reversible identities", async () => {
	const calls = [];
	const db = /** @type {any} */ ({
		async query(sql, parameters) {
			calls.push({ sql, parameters });
			return {
				rows: [
					{
						exercise_name: "Bench press",
						exercise_variant_name: "Barbell",
						occurrence_count: "3",
						first_date: "2026-07-01",
						last_date: new Date("2026-09-01T00:00:00.000Z"),
					},
					{
						exercise_name: "Pull-up",
						exercise_variant_name: null,
						occurrence_count: 1,
						first_date: "2026-08-01",
						last_date: "2026-08-01",
					},
				],
			};
		},
	});

	const choices = await getExerciseProgressChoices({ userId: 7, programId: 4 }, db);

	assert.deepEqual(calls[0].parameters, [7, 4]);
	assert.match(calls[0].sql, /p\.user_id = \$1/);
	assert.match(calls[0].sql, /p\.id = \$2/);
	assert.match(calls[0].sql, /ws\.status = 'finished'/);
	assert.match(calls[0].sql, /wsl\.status = 'performed'/);
	assert.match(calls[0].sql, /BTRIM\(wsl\.exercise_name\)/);
	assert.deepEqual(choices, [
		{
			key: toExerciseProgressKey("Bench press", "Barbell"),
			exerciseName: "Bench press",
			exerciseVariantName: "Barbell",
			occurrenceCount: 3,
			firstDate: "2026-07-01",
			lastDate: "2026-09-01",
		},
		{
			key: toExerciseProgressKey("Pull-up", null),
			exerciseName: "Pull-up",
			exerciseVariantName: null,
			occurrenceCount: 1,
			firstDate: "2026-08-01",
			lastDate: "2026-08-01",
		},
	]);
	assert.deepEqual(fromExerciseProgressKey(choices[0].key), {
		exerciseName: "Bench press",
		exerciseVariantName: "Barbell",
	});
});

test("exercise progress maps bounded occurrence trends, coverage, and separate units", async () => {
	const calls = [];
	const db = /** @type {any} */ ({
		async query(sql, parameters) {
			calls.push({ sql, parameters });
			return {
				rows: [
					{
						exercise_name: "Snapshot squat",
						exercise_variant_name: "Snapshot back squat",
						available_occurrence_count: "3",
						available_first_date: "2026-07-01",
						available_last_date: "2026-09-01",
						summary: {
							occurrenceCount: "3",
							performedStepCount: "4",
							recordedSetCount: "8",
							setsWithRepetitionsCount: "7",
							completedRepetitionCount: "48",
							setsWithLoadCount: "6",
							setsWithVolumeCount: "5",
							units: [
								{
									unit: "Kilograms",
									loadObservationCount: "5",
									maximumLoad: "102.5",
									volumeSetCount: "4",
									volume: "3100",
								},
								{
									unit: "Libra",
									loadObservationCount: 1,
									maximumLoad: 20,
									volumeSetCount: 1,
									volume: 160,
								},
							],
						},
						total_occurrence_count: "3",
						occurrences: [
							{
								workoutSessionId: 11,
								dateKey: "2026-09-01",
								finishedAt: "2026-09-01T10:00:00.000Z",
								sessionName: "First same-day workout",
								performedStepCount: 2,
								recordedSetCount: 3,
								setsWithRepetitionsCount: 3,
								completedRepetitionCount: 20,
								setsWithLoadCount: 2,
								setsWithVolumeCount: 2,
								units: [
									{
										unit: "Kilograms",
										loadObservationCount: 2,
										maximumLoad: 100,
										volumeSetCount: 2,
										volume: 1500,
									},
								],
							},
							{
								workoutSessionId: 12,
								dateKey: "2026-09-01",
								finishedAt: "2026-09-01T12:00:00.000Z",
								sessionName: "Second same-day workout",
								performedStepCount: 1,
								recordedSetCount: 2,
								setsWithRepetitionsCount: 1,
								completedRepetitionCount: 8,
								setsWithLoadCount: 2,
								setsWithVolumeCount: 1,
								units: [
									{
										unit: "Kilograms",
										loadObservationCount: 1,
										maximumLoad: 102.5,
										volumeSetCount: 0,
										volume: null,
									},
									{
										unit: "Libra",
										loadObservationCount: 1,
										maximumLoad: 20,
										volumeSetCount: 1,
										volume: 160,
									},
								],
							},
						],
					},
				],
			};
		},
	});
	const key = toExerciseProgressKey("Snapshot squat", "Snapshot back squat");
	const filters = { fromDate: "2026-08-01", toDate: "2026-09-01" };
	const progress = await getExerciseProgress(
		{
			userId: 7,
			programId: 4,
			exerciseKey: key,
			filters,
			pointLimit: MAX_EXERCISE_PROGRESS_POINT_LIMIT + 1,
		},
		db,
	);

	assert.deepEqual(calls[0].parameters, [
		7,
		4,
		"Snapshot squat",
		"Snapshot back squat",
		"2026-08-01",
		"2026-09-01",
		MAX_EXERCISE_PROGRESS_POINT_LIMIT,
	]);
	assert.match(calls[0].sql, /p\.user_id = \$1/);
	assert.match(calls[0].sql, /exercise_variant_name IS NOT DISTINCT FROM \$4/);
	assert.match(calls[0].sql, /LIMIT \$7/);
	assert.equal(progress?.selection.occurrenceCount, 3);
	assert.deepEqual(progress?.filters, filters);
	assert.deepEqual(progress?.summary, {
		occurrenceCount: 3,
		performedStepCount: 4,
		recordedSetCount: 8,
		setsWithRepetitionsCount: 7,
		completedRepetitionCount: 48,
		setsWithLoadCount: 6,
		setsWithVolumeCount: 5,
		units: [
			{
				unit: "Kilograms",
				loadObservationCount: 5,
				maximumLoad: 102.5,
				volumeSetCount: 4,
				volume: 3100,
			},
			{
				unit: "Libra",
				loadObservationCount: 1,
				maximumLoad: 20,
				volumeSetCount: 1,
				volume: 160,
			},
		],
	});
	assert.deepEqual(
		progress?.occurrences.map((occurrence) => [
			occurrence.workoutSessionId,
			occurrence.dateKey,
			occurrence.recordedSetCount,
		]),
		[
			[11, "2026-09-01", 3],
			[12, "2026-09-01", 2],
		],
	);
	assert.deepEqual(
		progress?.series.map((series) => [
			series.unit,
			series.points.map((point) => [
				point.workoutSessionId,
				point.maximumLoad,
				point.volume,
			]),
		]),
		[
			[
				"Kilograms",
				[
					[11, 100, 1500],
					[12, 102.5, null],
				],
			],
			["Libra", [[12, 20, 160]]],
		],
	);
	assert.equal(progress?.totalOccurrenceCount, 3);
	assert.equal(progress?.returnedOccurrenceCount, 2);
	assert.equal(progress?.isTruncated, true);
	assert.equal(progress?.pointLimit, MAX_EXERCISE_PROGRESS_POINT_LIMIT);
});

test("invalid or unavailable exercise identities remain indistinguishable", async () => {
	let queryCount = 0;
	const db = /** @type {any} */ ({
		async query() {
			queryCount += 1;
			return { rows: [] };
		},
	});
	const input = {
		userId: 3,
		programId: 9,
		filters: { fromDate: null, toDate: null },
	};

	assert.equal(
		await getExerciseProgress({ ...input, exerciseKey: "not-a-key" }, db),
		null,
	);
	assert.equal(queryCount, 0);
	assert.equal(
		await getExerciseProgress(
			{ ...input, exerciseKey: toExerciseProgressKey("Foreign", null) },
			db,
		),
		null,
	);
	assert.equal(queryCount, 1);
	assert.equal(fromExerciseProgressKey("snapshot.bm90LWpzb24"), null);
});

test("an available exercise can return an honest empty filtered range", async () => {
	const db = /** @type {any} */ ({
		async query() {
			return {
				rows: [
					{
						exercise_name: "Row",
						exercise_variant_name: "Cable row",
						available_occurrence_count: 2,
						available_first_date: "2026-01-01",
						available_last_date: "2026-02-01",
						summary: {
							occurrenceCount: 0,
							performedStepCount: 0,
							recordedSetCount: 0,
							setsWithRepetitionsCount: 0,
							completedRepetitionCount: 0,
							setsWithLoadCount: 0,
							setsWithVolumeCount: 0,
							units: [],
						},
						total_occurrence_count: 0,
						occurrences: [],
					},
				],
			};
		},
	});
	const progress = await getExerciseProgress(
		{
			userId: 1,
			programId: 2,
			exerciseKey: toExerciseProgressKey("Row", "Cable row"),
			filters: { fromDate: "2027-01-01", toDate: "2027-01-31" },
			pointLimit: 0,
		},
		db,
	);

	assert.equal(progress?.selection.occurrenceCount, 2);
	assert.equal(progress?.summary.occurrenceCount, 0);
	assert.deepEqual(progress?.occurrences, []);
	assert.deepEqual(progress?.series, []);
	assert.equal(progress?.isTruncated, false);
	assert.equal(progress?.pointLimit, 100);
});
