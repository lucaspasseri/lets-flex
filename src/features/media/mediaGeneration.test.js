import assert from "node:assert/strict";
import test from "node:test";

import {
	buildMediaGenerationPrompt,
	createOpenAiImageProvider,
	MediaGenerationError,
	normalizeGenerationRefinement,
	readOpenAiImageConfiguration,
	requestMediaGenerationCandidate,
} from "./mediaGeneration.js";
import {
	MEDIA_GENERATION_ENTITY_TYPES,
	MEDIA_GENERATION_PRESETS,
	supportsMediaGenerationEntity,
} from "./mediaGenerationPolicy.js";

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

test("generation policy shares supported entity types with the preset map", () => {
	assert.deepEqual(MEDIA_GENERATION_ENTITY_TYPES, [
		"exercise",
		"exercise_variant",
		"equipment",
		"movement_pattern",
	]);
	assert.deepEqual(
		Object.keys(MEDIA_GENERATION_PRESETS),
		MEDIA_GENERATION_ENTITY_TYPES,
	);
	assert.equal(supportsMediaGenerationEntity("equipment"), true);
	assert.equal(supportsMediaGenerationEntity("muscle"), false);
});

test("prompt builder uses only available verified catalog context", () => {
	const prompt = buildMediaGenerationPrompt({
		entity_type: "exercise_variant",
		canonical_name: "Dumbbell Lateral Raise",
		parent_name: "Lateral Raise",
		equipment_name: "Dumbbell",
		movement_pattern: null,
		setup_description: null,
		environment: "gym",
	});
	assert.match(prompt, /Equipment: Dumbbell/);
	assert.match(prompt, /Verified environment context: gym/);
	assert.doesNotMatch(prompt, /Movement pattern:/);
	assert.match(prompt, /No words, captions, logos/);
});

test("refinement is bounded and cannot contain control characters", () => {
	assert.equal(
		normalizeGenerationRefinement("  show full dumbbells  "),
		"show full dumbbells",
	);
	assert.equal(normalizeGenerationRefinement(""), null);
	assert.throws(() => normalizeGenerationRefinement("x\n"), MediaGenerationError);
	assert.throws(
		() => normalizeGenerationRefinement("x".repeat(281)),
		MediaGenerationError,
	);
});

test("OpenAI adapter normalizes a single Image API response", async () => {
	let request;
	const provider = createOpenAiImageProvider({
		configuration: {
			apiKey: "test-key",
			timeoutMs: 1_000,
			model: "gpt-image-2.5-flare",
		},
		fetchImplementation: async (url, options) => {
			request = { url, options };
			return new Response(
				JSON.stringify({ data: [{ b64_json: pngFixture().toString("base64") }] }),
				{ status: 200 },
			);
		},
	});
	const result = await provider.generate({ prompt: "prompt" });
	assert.equal(request.url, "https://api.openai.com/v1/images/generations");
	assert.equal(JSON.parse(request.options.body).model, "gpt-image-2.5-flare");
	assert.equal(result.provider, "openai");
	assert.equal(result.buffer.length, pngFixture().length);
});

test("missing OpenAI configuration fails without constructing a provider", () => {
	assert.throws(
		() => readOpenAiImageConfiguration({}),
		(error) => error instanceof MediaGenerationError && error.code === "not_configured",
	);
});

test("generation persists an unapproved private candidate only after byte inspection", async () => {
	const queries = [];
	const db = {
		async query(text, values) {
			queries.push({ text, values });
			if (queries.length === 1)
				return {
					rows: [
						{
							entity_type: "equipment",
							entity_id: 8,
							canonical_name: "Kettlebell",
							name: "Kettlebell",
						},
					],
				};
			return {
				rows: [{ id: 31, status: "pending_review", storage_key: "candidate.png" }],
			};
		},
	};
	let removed = false;
	const candidate = await requestMediaGenerationCandidate(
		{ entityType: "equipment", entityId: 8, requestedByUserId: 1 },
		{
			db: /** @type {any} */ (db),
			provider: {
				async generate() {
					return {
						buffer: pngFixture(),
						mimeType: "image/png",
						provider: "openai",
						model: "gpt-image-2.5-flare",
					};
				},
			},
			storage: {
				async save() {
					return {
						storageKey: "candidate.png",
						async remove() {
							removed = true;
						},
					};
				},
			},
		},
	);
	assert.equal(candidate.status, "pending_review");
	assert.equal(removed, false);
	assert.match(queries[1].text, /media_generation_candidates/);
	assert.doesNotMatch(queries.map((query) => query.text).join("\n"), /entity_media/);
});

test("an empty refinement proceeds as an optional preference for a supported target", async () => {
	const queries = [];
	const db = {
		async query(text, values) {
			queries.push({ text, values });
			if (queries.length === 1) {
				return {
					rows: [
						{
							entity_type: "equipment",
							entity_id: 8,
							canonical_name: "Kettlebell",
							name: "Kettlebell",
						},
					],
				};
			}
			return {
				rows: [{ id: 32, status: "pending_review", storage_key: "candidate.png" }],
			};
		},
	};
	let prompt;
	const candidate = await requestMediaGenerationCandidate(
		{ entityType: "equipment", entityId: 8, requestedByUserId: 1, refinement: "" },
		{
			db: /** @type {any} */ (db),
			provider: {
				async generate(input) {
					prompt = input.prompt;
					return {
						buffer: pngFixture(),
						mimeType: "image/png",
						provider: "openai",
						model: "gpt-image-2.5-flare",
					};
				},
			},
			storage: {
				async save() {
					return { storageKey: "candidate.png", async remove() {} };
				},
			},
		},
	);
	assert.equal(candidate.status, "pending_review");
	assert.doesNotMatch(prompt, /Optional visual preference/);
});
