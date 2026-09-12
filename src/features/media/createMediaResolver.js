import { resolveEntityMediaFromAssignments } from "./resolveEntityMedia.js";
import { resolveMedia as resolveStaticMedia } from "./resolveMedia.js";

/** @typedef {import("./media.types.js").EntityMediaRequest} EntityMediaRequest */
/** @typedef {import("./media.types.js").MediaRequest} MediaRequest */
/** @typedef {import("./media.types.js").ResolvedMedia} ResolvedMedia */

/**
 * Create the shared synchronous presentation resolver used by view-models.
 * Persistent assignments are loaded once per page; requests without stable
 * entity IDs retain the existing manifest-only contract.
 *
 * @param {Array<Record<string, any>>} [assignments]
 * @returns {(request: EntityMediaRequest | MediaRequest) => ResolvedMedia}
 */
export default function createMediaResolver(assignments = []) {
	return (request) => {
		if (hasEntityIdentity(request)) {
			return resolveEntityMediaFromAssignments(request, assignments);
		}
		return resolveStaticMedia(request);
	};
}

/**
 * @param {EntityMediaRequest | MediaRequest} request
 * @returns {request is EntityMediaRequest}
 */
function hasEntityIdentity(request) {
	return (
		typeof (/** @type {any} */ (request).entityId) === "number" &&
		[
			"exercise",
			"exercise_variant",
			"muscle",
			"equipment",
			"movement_pattern",
		].includes(request.entityType)
	);
}
