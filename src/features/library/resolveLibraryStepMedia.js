import resolveStepMedia from "../media/resolveStepMedia.js";

/** @typedef {import("../sessions/sessions.types.js").SessionMapperStep} SessionMapperStep */

/**
 * Resolve Library step media as a compact initial tile without changing the
 * image presentation used by Dashboard and Program Day.
 *
 * @param {SessionMapperStep} step
 */
export default function resolveLibraryStepMedia(step) {
	return resolveStepMedia(step, { presentation: "initial" });
}
