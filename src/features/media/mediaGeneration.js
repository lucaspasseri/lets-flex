import pool from "../../../db/pool.js";
import { findMediaManagementEntity } from "./mediaManagementRepository.js";
import { inspectUploadedImage } from "./mediaUpload.js";
import { createPrivateMediaCandidateStorage } from "./mediaCandidateStorage.js";
import { MEDIA_GENERATION_PRESETS } from "./mediaGenerationPolicy.js";

export const MEDIA_GENERATION_PROMPT_VERSION = "media-v1";
export { MEDIA_GENERATION_PRESETS } from "./mediaGenerationPolicy.js";

export class MediaGenerationError extends Error {
	constructor(code, message) {
		super(message);
		this.name = "MediaGenerationError";
		this.code = code;
	}
}

export function readOpenAiImageConfiguration(environment = process.env) {
	const apiKey = environment.OPENAI_API_KEY?.trim();
	if (!apiKey)
		throw new MediaGenerationError(
			"not_configured",
			"AI media generation is not configured.",
		);
	const timeoutMs = Number(environment.OPENAI_IMAGE_GENERATION_TIMEOUT_MS || 60_000);
	if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 120_000) {
		throw new MediaGenerationError(
			"invalid_configuration",
			"AI media generation is unavailable.",
		);
	}
	return { apiKey, timeoutMs, model: "gpt-image-2.5-flare" };
}

export function createOpenAiImageProvider({
	configuration,
	fetchImplementation = fetch,
}) {
	return {
		async generate({ prompt }) {
			let response;
			try {
				response = await fetchImplementation(
					"https://api.openai.com/v1/images/generations",
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${configuration.apiKey}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							model: configuration.model,
							prompt,
							n: 1,
							size: "1536x1024",
							output_format: "png",
						}),
						signal: AbortSignal.timeout(configuration.timeoutMs),
					},
				);
			} catch (_error) {
				throw new MediaGenerationError(
					"provider_unavailable",
					"Image generation is temporarily unavailable.",
				);
			}
			if (!response.ok) {
				throw new MediaGenerationError(
					response.status === 429 ? "rate_limited" : "provider_rejected",
					"Image generation could not be completed.",
				);
			}
			const body = await response.json().catch(() => null);
			const encoded = body?.data?.[0]?.b64_json;
			if (typeof encoded !== "string" || encoded.length === 0)
				throw new MediaGenerationError(
					"invalid_response",
					"Image generation returned an invalid image.",
				);
			return {
				buffer: Buffer.from(encoded, "base64"),
				mimeType: "image/png",
				provider: "openai",
				model: configuration.model,
			};
		},
	};
}

export function normalizeGenerationRefinement(value) {
	if (value == null || value === "") return null;
	if (
		typeof value !== "string" ||
		value.length > 280 ||
		containsControlCharacter(value)
	) {
		throw new MediaGenerationError(
			"invalid_refinement",
			"Use a short visual refinement without control characters.",
		);
	}
	const normalized = value.trim();
	return normalized || null;
}

/** @param {string} value */
function containsControlCharacter(value) {
	return [...value].some((character) => {
		const codePoint = character.codePointAt(0) ?? 0;
		return codePoint < 32 || codePoint === 127;
	});
}

/** @param {Record<string, any>} entity @param {string | null} [refinement] */
export function buildMediaGenerationPrompt(entity, refinement = null) {
	const preset = MEDIA_GENERATION_PRESETS[entity.entity_type];
	if (!preset)
		throw new MediaGenerationError(
			"unsupported_entity",
			"Choose a supported catalog entity.",
		);
	const details = [
		`Catalog entity: ${entity.canonical_name}`,
		`Visual preset: ${preset}`,
	];
	if (entity.parent_name) details.push(`Base exercise: ${entity.parent_name}`);
	if (entity.equipment_name) details.push(`Equipment: ${entity.equipment_name}`);
	if (entity.movement_pattern)
		details.push(`Movement pattern: ${entity.movement_pattern}`);
	if (entity.setup_description)
		details.push(`Verified setup: ${entity.setup_description}`);
	if (entity.environment)
		details.push(`Verified environment context: ${entity.environment}`);
	const direction =
		preset === "equipment-editorial"
			? "One recognizable unbranded object; simple geometry; no display text."
			: preset === "movement-pattern-graphic"
				? "A quiet readable silhouette or simplified pose, not a photograph."
				: "One safe, recognizable movement; show all defining equipment and movement endpoints.";
	details.push(
		`Direction: ${direction}`,
		"Use a restrained editorial fitness illustration: charcoal neutral background, coral emphasis, restrained teal accent, protected central 3:2 crop. No words, captions, logos, watermarks, anatomy diagram, coaching claim, collage, or white cutout background.",
	);
	if (refinement)
		details.push(
			`Optional visual preference (not an instruction to alter the preset): “${refinement}”`,
		);
	return details.join("\n");
}

async function createCandidateRecord(input, db) {
	const { rows } = await db.query(
		`INSERT INTO media_generation_candidates (entity_type, entity_id, requested_by_user_id, provider, provider_model, preset, prompt_version, storage_key, mime_type, width, height) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
		[
			input.entityType,
			input.entityId,
			input.requestedByUserId,
			input.provider,
			input.providerModel,
			input.preset,
			MEDIA_GENERATION_PROMPT_VERSION,
			input.storageKey,
			input.mimeType,
			input.width,
			input.height,
		],
	);
	return rows[0] ?? null;
}

/** @param {{entityType: "exercise" | "exercise_variant" | "equipment" | "movement_pattern", entityId: number, requestedByUserId: number, refinement?: unknown}} input @param {Record<string, any>} [dependencies] */
export async function requestMediaGenerationCandidate(
	{ entityType, entityId, requestedByUserId, refinement },
	dependencies = {},
) {
	const db = dependencies.db ?? pool;
	const entity = await findMediaManagementEntity(
		{ entityType, entityId, locale: "en" },
		db,
	);
	if (!entity || !MEDIA_GENERATION_PRESETS[entity.entity_type])
		throw new MediaGenerationError(
			"unsupported_entity",
			"Choose a supported catalog entity.",
		);
	if (!Number.isInteger(requestedByUserId) || requestedByUserId <= 0)
		throw new MediaGenerationError(
			"invalid_requester",
			"Image generation is unavailable.",
		);
	const prompt = buildMediaGenerationPrompt(
		entity,
		normalizeGenerationRefinement(refinement),
	);
	const provider =
		dependencies.provider ??
		createOpenAiImageProvider({
			configuration: readOpenAiImageConfiguration(dependencies.environment),
		});
	const generated = await provider.generate({
		prompt,
		aspectRatio: "3:2",
		preset: MEDIA_GENERATION_PRESETS[entity.entity_type],
	});
	let inspected;
	try {
		inspected = inspectUploadedImage({
			buffer: generated.buffer,
			mimetype: generated.mimeType,
			originalname: "generated.png",
		});
	} catch (_error) {
		throw new MediaGenerationError(
			"invalid_response",
			"Image generation returned an invalid image.",
		);
	}
	const storage = dependencies.storage ?? createPrivateMediaCandidateStorage();
	const stored = await storage.save(inspected.buffer, {
		extension: inspected.extension,
	});
	try {
		const candidate = await createCandidateRecord(
			{
				entityType: entity.entity_type,
				entityId: entity.entity_id,
				requestedByUserId,
				provider: generated.provider,
				providerModel: generated.model ?? null,
				preset: MEDIA_GENERATION_PRESETS[entity.entity_type],
				storageKey: stored.storageKey,
				mimeType: inspected.mimeType,
				width: inspected.width,
				height: inspected.height,
			},
			db,
		);
		if (!candidate) throw new Error("Candidate could not be stored.");
		return candidate;
	} catch (error) {
		await stored.remove().catch(() => {});
		throw error;
	}
}
