import pool from "../../../db/pool.js";
import { findPrimaryMediaAssignments } from "./mediaRepository.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */
/** @typedef {import("./media.types.js").MediaAssignmentCandidate} MediaAssignmentCandidate */

/**
 * Load all media assignments needed by a representative page in one query.
 * The page still falls back safely when the assignment table is empty.
 *
 * @param {{exerciseTemplates?: Array<any>, sessions?: Array<any>, workoutSessions?: Array<any>}} data
 * @param {DatabaseClient} [db]
 */
export async function loadMediaAssignments(data, db = pool) {
	return findPrimaryMediaAssignments(collectMediaCandidates(data), db);
}

/**
 * @param {{exerciseTemplates?: Array<any>, sessions?: Array<any>, workoutSessions?: Array<any>}} data
 * @returns {MediaAssignmentCandidate[]}
 */
export function collectMediaCandidates({
	exerciseTemplates = [],
	sessions = [],
	workoutSessions = [],
}) {
	const candidates = new Map();
	for (const template of exerciseTemplates) {
		addCandidate(candidates, "exercise", template.id);
		addCandidate(candidates, "exercise_variant", template.variant?.id);
		addCandidate(candidates, "movement_pattern", template.movementPattern?.id);
	}
	for (const session of [...sessions, ...workoutSessions]) {
		for (const step of session.steps ?? []) addStepCandidates(candidates, step);
	}
	return [...candidates.values()];
}

/**
 * @param {Map<string, MediaAssignmentCandidate>} candidates
 * @param {MediaAssignmentCandidate["entityType"]} entityType
 * @param {unknown} entityId
 */
function addCandidate(candidates, entityType, entityId) {
	if (typeof entityId !== "number" || !Number.isInteger(entityId) || entityId <= 0)
		return;
	const candidate = { entityType, entityId };
	candidates.set(entityType + ":" + entityId, candidate);
}

/** @param {Map<string, MediaAssignmentCandidate>} candidates @param {any} step */
function addStepCandidates(candidates, step) {
	addCandidate(candidates, "exercise_variant", step.exerciseVariantId);
	addCandidate(candidates, "exercise", step.exerciseId);
	addCandidate(candidates, "movement_pattern", step.movementPatternId);
}
