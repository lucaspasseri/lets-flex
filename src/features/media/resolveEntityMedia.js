import { findPrimaryMediaAssignments } from "./mediaRepository.js";
import { resolveMedia as resolveStaticMedia } from "./resolveMedia.js";

/** @typedef {import("./media.types.js").EntityMediaRequest} EntityMediaRequest */
/** @typedef {import("./media.types.js").ResolvedMedia} ResolvedMedia */
/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/**
 * Resolve persistent media first, then use the existing contextual manifest
 * and initial fallback contract. Database rows are never exposed to callers.
 *
 * @param {EntityMediaRequest} request
 * @param {DatabaseClient} [db]
 * @returns {Promise<ResolvedMedia>}
 */
export async function resolveEntityMedia(request, db) {
	const assignments = await findPrimaryMediaAssignments(getCandidates(request), db);
	return resolveEntityMediaFromAssignments(request, assignments);
}

/**
 * Resolve a request against already loaded assignments. Page view-models use
 * this synchronous boundary after loading all visible candidates in one query.
 *
 * @param {EntityMediaRequest} request
 * @param {Array<Record<string, any>>} assignments
 * @returns {ResolvedMedia}
 */
export function resolveEntityMediaFromAssignments(request, assignments) {
	const candidates = getCandidates(request);
	const byCandidate = new Map(
		assignments.map((assignment) => [
			assignment.entity_type + ":" + assignment.entity_id,
			assignment,
		]),
	);

	for (const [index, candidate] of candidates.entries()) {
		const assignment = byCandidate.get(candidate.entityType + ":" + candidate.entityId);
		if (assignment) {
			return toResolvedMedia(
				assignment,
				request,
				candidate.entityType,
				index === 0 ? "none" : fallbackTypeFor(candidate.entityType),
				index !== 0,
			);
		}
	}

	const legacyRequest = {
		...request,
		entityType:
			request.entityType === "exercise_variant" ? "exercise" : request.entityType,
		key: request.entityId ? String(request.entityId) : undefined,
	};
	const resolved = resolveStaticMedia(/** @type {any} */ (legacyRequest));
	return {
		...resolved,
		mediaType: resolved.presentation,
		fallbackType: resolved.isFallback ? fallbackTypeFor(resolved.matchType) : "none",
	};
}

/**
 * @param {EntityMediaRequest} request
 * @returns {Array<{entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityId: number}>}
 */
function getCandidates(request) {
	return /** @type {Array<{entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityId: number}>} */ ([
		{ entityType: request.entityType, entityId: request.entityId },
		...(request.entityType === "exercise_variant" && request.parentExerciseId
			? [{ entityType: "exercise", entityId: request.parentExerciseId }]
			: []),
		...(request.movementPatternId
			? [
					{
						entityType: "movement_pattern",
						entityId: request.movementPatternId,
					},
				]
			: []),
	]);
}

/**
 * @param {Record<string, any>} asset
 * @param {EntityMediaRequest} request
 * @param {string} matchedEntityType
 * @param {"none" | "base-exercise" | "movement-pattern" | "environment" | "category" | "initial"} fallbackType
 * @param {boolean} isFallback
 * @returns {ResolvedMedia}
 */
function toResolvedMedia(asset, request, matchedEntityType, fallbackType, isFallback) {
	const label = request.label?.trim() || "Training content";
	const presentation = request.presentation ?? "image";
	const mediaType = presentation === "initial" ? "initial" : "image";

	if (mediaType === "initial") {
		return {
			src: null,
			alt: label + " — initial tile",
			width: asset.width,
			height: asset.height,
			aspectRatio: asset.width / asset.height,
			matchType: "placeholder",
			mediaType,
			fallbackType: "initial",
			presentation: "initial",
			initial: firstMeaningfulLetter(label),
			entityType: request.entityType,
			matchedKey: null,
			matchedId: asset.entity_id,
			isFallback: true,
		};
	}

	return {
		src: asset.storage_key,
		alt: asset.alt_text?.trim() || label + " image",
		width: asset.width,
		height: asset.height,
		aspectRatio: asset.width / asset.height,
		matchType: /** @type {any} */ (matchedEntityType),
		mediaType,
		fallbackType,
		presentation: "image",
		initial: null,
		entityType: request.entityType,
		matchedKey: null,
		matchedId: asset.entity_id,
		isFallback,
	};
}

/** @param {string} entityType @returns {"base-exercise" | "movement-pattern" | "environment" | "category" | "initial"} */
function fallbackTypeFor(entityType) {
	return (
		{
			exercise: "base-exercise",
			movement_pattern: "movement-pattern",
			environment: "environment",
			category: "category",
			placeholder: "initial",
		}[entityType] ?? "initial"
	);
}

/** @param {string} value @returns {string} */
function firstMeaningfulLetter(value) {
	return value.match(/\p{L}/u)?.[0]?.toLocaleUpperCase("en-US") ?? "?";
}
