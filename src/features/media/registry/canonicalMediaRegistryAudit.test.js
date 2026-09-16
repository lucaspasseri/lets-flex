import assert from "node:assert/strict";
import test from "node:test";

import { auditCanonicalRegistry } from "./canonicalMediaRegistryAudit.js";
import { formatCanonicalRegistryAudit } from "../../../../scripts/canonical-registry-audit.mjs";

const entry =
	/** @type {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} */ ({
		schemaVersion: 1,
		entityType: "exercise",
		entityKey: "push-up",
		role: "canonical",
		asset: {
			objectKey: "assets/promoted-push-up.webp",
			mimeType: "image/webp",
			width: 10,
			height: 20,
		},
		canonicalPath: "/media/catalog/promoted/exercise/push-up.webp",
		alt: { en: "Push-up", "pt-BR": "Flexão" },
		updatedAt: "2026-09-16T00:00:00.000Z",
	});

function database(state) {
	const calls = [];
	return {
		calls,
		async query(text) {
			calls.push(text);
			return { rows: state ? [state] : [] };
		},
	};
}

function dependencies({ state = {}, exists = true } = {}) {
	const db = database({
		id: 41,
		catalog_key: entry.entityKey,
		media_asset_id: 88,
		canonical_path: entry.canonicalPath,
		storage_key: entry.asset.objectKey,
		mime_type: entry.asset.mimeType,
		width: entry.asset.width,
		height: entry.asset.height,
		alt_text_en: entry.alt.en,
		alt_text_pt_br: entry.alt["pt-BR"],
		...state,
	});
	return {
		registry: /** @type {any} */ ({
			async listCanonicalOverrides() {
				return [{ entry, etag: "etag" }];
			},
		}),
		mediaStorage: {
			async exists() {
				return exists;
			},
		},
		db: /** @type {any} */ (db),
	};
}

test("registry audit reports agreement as OK", async () => {
	const result = await auditCanonicalRegistry(dependencies());
	assert.deepEqual(result.summary, { ok: 1, warning: 0, error: 0 });
	assert.equal(result.reports[0].status, "OK");
	assert.match(formatCanonicalRegistryAudit(result), /OK\s+exercise\/push-up/);
	assert.match(
		formatCanonicalRegistryAudit(result),
		/registry, R2 object, catalog, and DB/,
	);
});

test("registry audit distinguishes database drift from broken durable dependencies", async () => {
	const warning = await auditCanonicalRegistry(
		dependencies({ state: { storage_key: "assets/old.webp" } }),
	);
	assert.equal(warning.reports[0].status, "WARNING");
	assert.match(warning.reports[0].issues[0], /differs from durable registry/);

	const error = await auditCanonicalRegistry(dependencies({ exists: false }));
	assert.equal(error.reports[0].status, "ERROR");
	assert.match(error.reports[0].issues[0], /missing R2 object/);
});

test("registry audit reports missing database state and does not write", async () => {
	const db = database(null);
	const deps = dependencies();
	deps.db = /** @type {any} */ (db);
	const result = await auditCanonicalRegistry(deps);
	assert.equal(result.reports[0].status, "ERROR");
	assert.match(result.reports[0].issues[0], /catalog entity is missing/);
	assert.equal(
		db.calls.some((query) => /INSERT|UPDATE|DELETE/u.test(query)),
		false,
	);
});
