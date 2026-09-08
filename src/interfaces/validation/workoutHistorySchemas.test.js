import assert from "node:assert/strict";
import test from "node:test";
import { MAX_HISTORY_PAGE } from "../../features/workoutHistory/getWorkoutHistoryPage.js";
import {
	workoutHistoryParamsSchema,
	workoutHistoryQuerySchema,
} from "./workoutHistorySchemas.js";

test("history query normalizes filters, defaults the page, and strips unknown fields", () => {
	assert.deepEqual(
		workoutHistoryQuerySchema.parse({
			programId: "7",
			fromDate: "2026-08-01",
			toDate: "2026-08-31",
			unexpected: "removed",
		}),
		{
			programId: 7,
			fromDate: "2026-08-01",
			toDate: "2026-08-31",
			page: 1,
		},
	);
	assert.deepEqual(workoutHistoryQuerySchema.parse({}), {
		programId: null,
		fromDate: null,
		toDate: null,
		page: 1,
	});
});

test("history query rejects malformed filters, reversed dates, and unbounded pages", () => {
	for (const query of [
		{ programId: "foreign" },
		{ fromDate: "2026-02-30" },
		{ fromDate: "2026-09-02", toDate: "2026-09-01" },
		{ page: "0" },
		{ page: String(MAX_HISTORY_PAGE + 1) },
	]) {
		assert.equal(workoutHistoryQuerySchema.safeParse(query).success, false);
	}
});

test("history params accept only positive integer session IDs", () => {
	assert.deepEqual(workoutHistoryParamsSchema.parse({ workoutSessionId: "42" }), {
		workoutSessionId: 42,
	});
	for (const workoutSessionId of ["", "0", "-1", "1.5", "session"]) {
		assert.equal(
			workoutHistoryParamsSchema.safeParse({ workoutSessionId }).success,
			false,
		);
	}
});
