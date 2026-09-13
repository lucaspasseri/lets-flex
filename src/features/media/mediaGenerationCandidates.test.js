import assert from "node:assert/strict";
import test from "node:test";

import {
	findLatestPendingMediaGenerationCandidate,
	rejectMediaGenerationCandidate,
} from "./mediaGenerationCandidates.js";

test("candidate lookup returns only the latest pending row and tolerates an unreset development schema", async () => {
	const candidate = await findLatestPendingMediaGenerationCandidate(
		{ entityType: "exercise", entityId: 7 },
		/** @type {any} */ ({
			async query(text, values) {
				assert.match(text, /status = 'pending_review'/);
				assert.deepEqual(values, ["exercise", 7]);
				return { rows: [{ id: 13, status: "pending_review" }] };
			},
		}),
	);
	assert.equal(candidate.id, 13);
	assert.equal(
		await findLatestPendingMediaGenerationCandidate(
			{ entityType: "exercise", entityId: 7 },
			/** @type {any} */ ({
				async query() {
					throw { code: "42P01" };
				},
			}),
		),
		null,
	);
});

test("candidate rejection records an audited rejection before removing the private file", async () => {
	const calls = [];
	const client = {
		async query(text) {
			calls.push(
				text === "BEGIN" || text === "COMMIT"
					? text
					: text.includes("FOR UPDATE")
						? "lock"
						: "reject",
			);
			if (text === "BEGIN" || text === "COMMIT") return { rows: [] };
			if (text.includes("FOR UPDATE"))
				return {
					rows: [
						{ id: 13, entity_type: "exercise", entity_id: 7, storage_key: "abc.png" },
					],
				};
			return {
				rows: [{ id: 13, entity_type: "exercise", entity_id: 7, status: "rejected" }],
			};
		},
		release() {
			calls.push("release");
		},
	};
	const result = await rejectMediaGenerationCandidate(
		{
			candidateId: 13,
			entityType: "exercise",
			entityId: 7,
			reviewerUserId: 2,
			storage: {
				async remove(storageKey) {
					calls.push(`remove:${storageKey}`);
				},
			},
		},
		/** @type {any} */ ({
			async query(text) {
				calls.push(text.includes("private_file_removed_at") ? "cleanup" : "unexpected");
				return { rows: [] };
			},
			async connect() {
				return client;
			},
		}),
	);
	assert.equal(result.status, "rejected");
	assert.deepEqual(calls, [
		"BEGIN",
		"lock",
		"reject",
		"COMMIT",
		"remove:abc.png",
		"cleanup",
		"release",
	]);
});

test("candidate rejection leaves a mismatched target untouched", async () => {
	let removed = false;
	const calls = [];
	const result = await rejectMediaGenerationCandidate(
		{
			candidateId: 13,
			entityType: "equipment",
			entityId: 7,
			reviewerUserId: 2,
			storage: {
				async remove() {
					removed = true;
				},
			},
		},
		/** @type {any} */ ({
			async connect() {
				return {
					async query(text) {
						calls.push(text);
						if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
						return {
							rows: [
								{
									id: 13,
									entity_type: "exercise",
									entity_id: 7,
									storage_key: "abc.png",
								},
							],
						};
					},
					release() {
						calls.push("release");
					},
				};
			},
		}),
	);
	assert.equal(result, null);
	assert.equal(removed, false);
	assert.ok(calls.includes("ROLLBACK"));
});
