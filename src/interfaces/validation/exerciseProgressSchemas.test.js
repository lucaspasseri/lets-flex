import assert from "node:assert/strict";
import test from "node:test";
import { toExerciseProgressKey } from "../../features/exerciseProgress/mapper.js";
import { exerciseProgressQuerySchema } from "./exerciseProgressSchemas.js";

test("progress query normalizes owned selection filters and strips unknown fields", () => {
	const exerciseKey = toExerciseProgressKey("Squat", "Back squat");
	assert.deepEqual(
		exerciseProgressQuerySchema.parse({
			programId: "12",
			exerciseKey,
			fromDate: "2026-08-01",
			toDate: "2026-09-01",
			pointLimit: "200",
			ignored: "value",
		}),
		{
			programId: 12,
			exerciseKey,
			fromDate: "2026-08-01",
			toDate: "2026-09-01",
			pointLimit: 200,
		},
	);
	assert.deepEqual(exerciseProgressQuerySchema.parse({}), {
		programId: null,
		exerciseKey: null,
		fromDate: null,
		toDate: null,
		pointLimit: 100,
	});
	assert.deepEqual(
		exerciseProgressQuerySchema.parse({
			programId: "",
			exerciseKey: "",
			fromDate: "",
			toDate: "",
			pointLimit: "",
		}),
		{
			programId: null,
			exerciseKey: null,
			fromDate: null,
			toDate: null,
			pointLimit: 100,
		},
	);
});

test("progress query rejects malformed identities, dates, ranges, limits, and IDs", () => {
	const validKey = toExerciseProgressKey("Squat", null);
	for (const input of [
		{ programId: "0" },
		{ programId: "1.5" },
		{ exerciseKey: "not-a-snapshot-key" },
		{ exerciseKey: `${validKey}=` },
		{ fromDate: "2026-02-30" },
		{ toDate: "not-a-date" },
		{ fromDate: "2026-09-02", toDate: "2026-09-01" },
		{ pointLimit: "0" },
		{ pointLimit: "201" },
		{ pointLimit: "1.5" },
	]) {
		assert.equal(exerciseProgressQuerySchema.safeParse(input).success, false);
	}
});
