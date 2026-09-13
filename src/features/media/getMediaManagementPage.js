import pool from "../../../db/pool.js";
import { findPrimaryMediaAssignments, findMediaAssets } from "./mediaRepository.js";
import {
	findMediaManagementEntity,
	findMediaManagementEntityOptions,
} from "./mediaManagementRepository.js";
import { resolveEntityMediaFromAssignments } from "./resolveEntityMedia.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/**
 * Load the data needed by the admin editor. The effective preview uses the same assignment
 * resolver as normal application pages and never exposes database rows to the view directly.
 *
 * @param {{entityType?: unknown, entityTypeFilter?: unknown, entityId?: unknown, search?: unknown, locale?: unknown}} [input]
 * @param {DatabaseClient} [db]
 */
export default async function getMediaManagementPage(input = {}, db = pool) {
	const selectedEntityId =
		typeof input.entityId === "number" && Number.isInteger(input.entityId)
			? input.entityId
			: null;
	const normalizedLocale = /** @type {"en" | "pt-BR"} */ (
		input.locale === "pt-BR" ? "pt-BR" : "en"
	);
	const options = await findMediaManagementEntityOptions(
		{ locale: input.locale, entityType: input.entityTypeFilter, search: input.search },
		db,
	);
	const selected =
		typeof input.entityType === "string" &&
		selectedEntityId !== null &&
		selectedEntityId > 0
			? await findMediaManagementEntity(
					{
						entityType: /** @type {any} */ (input.entityType),
						entityId: selectedEntityId,
						locale: input.locale,
					},
					db,
				)
			: null;
	const assets = await findMediaAssets({}, db);

	if (!selected) {
		return {
			options,
			assets,
			selected: null,
			entityType:
				typeof input.entityTypeFilter === "string" ? input.entityTypeFilter : "",
			search: typeof input.search === "string" ? input.search : "",
		};
	}

	const candidates = [
		{ entityType: selected.entity_type, entityId: selected.entity_id },
		...(selected.entity_type === "exercise_variant" && selected.parent_exercise_id
			? [{ entityType: "exercise", entityId: selected.parent_exercise_id }]
			: []),
		...(selected.movement_pattern_id
			? [{ entityType: "movement_pattern", entityId: selected.movement_pattern_id }]
			: []),
	];
	const assignments = await findPrimaryMediaAssignments(candidates, db);
	const request = {
		entityType: selected.entity_type,
		entityId: selected.entity_id,
		parentExerciseId: selected.parent_exercise_id ?? undefined,
		movementPatternId: selected.movement_pattern_id ?? undefined,
		variantName:
			selected.entity_type === "exercise_variant" ? selected.canonical_name : undefined,
		baseName:
			selected.entity_type === "exercise_variant"
				? selected.parent_name
				: selected.canonical_name,
		movementPattern: selected.movement_pattern ?? undefined,
		environment: selected.environment ?? undefined,
		label: selected.name,
		locale: normalizedLocale,
	};
	const effectiveMedia = resolveEntityMediaFromAssignments(request, assignments);
	const directAssignment = assignments.find(
		(assignment) =>
			assignment.entity_type === selected.entity_type &&
			assignment.entity_id === selected.entity_id,
	);

	return {
		options,
		assets,
		entityType:
			typeof input.entityTypeFilter === "string" ? input.entityTypeFilter : "",
		search: typeof input.search === "string" ? input.search : "",
		selected: {
			...selected,
			request,
			directAssignment,
			effectiveMedia,
			effectiveSource: effectiveMedia.isFallback
				? effectiveMedia.fallbackType
				: "direct",
			altTexts: {
				en: directAssignment?.alt_text_en ?? null,
				"pt-BR": directAssignment?.alt_text_pt_br ?? null,
			},
		},
	};
}
