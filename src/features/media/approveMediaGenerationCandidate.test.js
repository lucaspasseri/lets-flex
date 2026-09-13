import assert from "node:assert/strict";
import test from "node:test";

import {
	approveMediaGenerationCandidate,
	MediaGenerationApprovalError,
} from "./approveMediaGenerationCandidate.js";

function pngFixture() {
	const buffer = Buffer.alloc(45);
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
	buffer.writeUInt32BE(13, 8);
	buffer.write("IHDR", 12, "ascii");
	buffer.writeUInt32BE(1536, 16);
	buffer.writeUInt32BE(1024, 20);
	buffer.write("IEND", 37, "ascii");
	return buffer;
}

function candidateRow() {
	return {
		id: 31,
		entity_type: "exercise",
		entity_id: 9,
		status: "pending_review",
		storage_key: "d2a1437a-b927-4cff-8a76-1207f9e8631c.png",
		mime_type: "image/png",
		width: 1536,
		height: 1024,
	};
}

function fakeDatabase({ createAsset = true } = {}) {
	const calls = [];
	const client = {
		async query(text) {
			calls.push(text);
			if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK")
				return { rows: [] };
			if (text.includes("FOR UPDATE")) return { rows: [candidateRow()] };
			if (text.includes("INSERT INTO media_assets"))
				return { rows: createAsset ? [{ id: 71 }] : [] };
			if (text.includes("INSERT INTO entity_media"))
				return { rows: [{ id: 19, media_asset_id: 71 }] };
			if (text.includes("SET status = 'approved'"))
				return { rows: [{ id: 31, status: "approved", approved_media_asset_id: 71 }] };
			return { rows: [] };
		},
		release() {
			calls.push("RELEASE");
		},
	};
	return {
		calls,
		async query(text) {
			calls.push(text);
			if (text.includes("WHERE id = $1 AND status = 'pending_review'"))
				return { rows: [candidateRow()] };
			return { rows: [] };
		},
		async connect() {
			return client;
		},
	};
}

function approvalInput(overrides = {}) {
	return {
		candidateId: 31,
		entityType: "exercise",
		entityId: 9,
		reviewerUserId: 2,
		altTexts: { en: "Barbell bench press", "pt-BR": "Supino reto com barra" },
		...overrides,
	};
}

test("approval creates a normal asset and replaces only the primary assignment after locking the candidate", async () => {
	const db = fakeDatabase();
	const events = [];
	const result = await approveMediaGenerationCandidate(approvalInput(), {
		db: /** @type {any} */ (db),
		privateStorage: /** @type {any} */ ({
			async read(storageKey) {
				events.push(`read:${storageKey}`);
				return pngFixture();
			},
			async remove(storageKey) {
				events.push(`remove:${storageKey}`);
			},
		}),
		publicStorage: /** @type {any} */ ({
			async save(_buffer, metadata) {
				events.push(`save:${metadata.extension}`);
				return { storageKey: "/media/uploads/approved.png", async remove() {} };
			},
		}),
	});

	assert.equal(result.candidate.status, "approved");
	assert.equal(result.asset.id, 71);
	assert.equal(result.privateCleanupPending, false);
	assert.deepEqual(events, [
		"read:d2a1437a-b927-4cff-8a76-1207f9e8631c.png",
		"save:png",
		"remove:d2a1437a-b927-4cff-8a76-1207f9e8631c.png",
	]);
	assert.ok(
		db.calls.some((call) => typeof call === "string" && call.includes("FOR UPDATE")),
	);
	assert.ok(
		db.calls.some(
			(call) => typeof call === "string" && call.includes("INSERT INTO media_assets"),
		),
	);
	assert.ok(
		db.calls.some(
			(call) => typeof call === "string" && call.includes("INSERT INTO entity_media"),
		),
	);
	assert.ok(
		db.calls.some(
			(call) =>
				typeof call === "string" &&
				call.includes("ON CONFLICT (entity_type, entity_id, role)"),
		),
	);
	assert.equal(
		db.calls.some(
			(call) => typeof call === "string" && call.includes("DELETE FROM media_assets"),
		),
		false,
	);
	assert.ok(
		db.calls.some(
			(call) => typeof call === "string" && call.includes("SET status = 'approved'"),
		),
	);
	assert.ok(db.calls.includes("COMMIT"));
});

test("approval rollback removes the new public file and preserves the pending private candidate", async () => {
	const db = fakeDatabase({ createAsset: false });
	let publicRemoved = false;
	let privateRemoved = false;
	await assert.rejects(
		() =>
			approveMediaGenerationCandidate(approvalInput(), {
				db: /** @type {any} */ (db),
				privateStorage: /** @type {any} */ ({
					async read() {
						return pngFixture();
					},
					async remove() {
						privateRemoved = true;
					},
				}),
				publicStorage: /** @type {any} */ ({
					async save() {
						return {
							storageKey: "/media/uploads/approved.png",
							async remove() {
								publicRemoved = true;
							},
						};
					},
				}),
			}),
		MediaGenerationApprovalError,
	);
	assert.equal(publicRemoved, true);
	assert.equal(privateRemoved, false);
	assert.ok(db.calls.includes("ROLLBACK"));
	assert.equal(
		db.calls.some((call) => String(call).includes("SET status = 'approved'")),
		false,
	);
});

test("approval requires both localized descriptions before candidate access", async () => {
	await assert.rejects(
		() =>
			approveMediaGenerationCandidate(
				approvalInput({ altTexts: { en: "Bench press", "pt-BR": "" } }),
				{ db: /** @type {any} */ (fakeDatabase()) },
			),
		(error) =>
			error instanceof MediaGenerationApprovalError &&
			error.code === "missing_alt_text",
	);
});
