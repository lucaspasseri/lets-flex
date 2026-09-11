const MEDIA_IMAGE_SELECTOR = "[data-media-fallback] img, img[data-media-fallback]";

/**
 * Remove broken-image chrome while keeping the surrounding exercise content usable.
 *
 * @param {Document | Element} [root]
 * @returns {void}
 */
export function initializeMediaFallback(root = document) {
	root.querySelectorAll(MEDIA_IMAGE_SELECTOR).forEach((image) => {
		if (!(image instanceof HTMLImageElement)) return;

		image.addEventListener(
			"error",
			() => {
				image.hidden = true;
				image.setAttribute("aria-hidden", "true");

				const media = image.closest("figure[data-media-fallback]");
				if (media) media.setAttribute("data-media-state", "error");
			},
			{ once: true },
		);
	});
}
