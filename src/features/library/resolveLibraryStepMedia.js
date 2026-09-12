import resolveStepMedia from "../media/resolveStepMedia.js";

/** @typedef {import("../sessions/sessions.types.js").SessionMapperStep} SessionMapperStep */

/**
 * Resolve Library step media as a compact initial tile without changing the
 * image presentation used by Dashboard and Program Day.
 *
 * @param {SessionMapperStep} step
 * @param {{resolveMedia?: Function}} [options]
 */
export default function resolveLibraryStepMedia(step, options = {}) {
	return resolveStepMedia(step, {
		presentation: options.resolveMedia ? "image" : "initial",
		resolveMedia: options.resolveMedia,
	});
}
