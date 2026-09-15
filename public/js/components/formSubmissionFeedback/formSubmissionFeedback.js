import { createBrowserTranslator } from "../../i18n.js";

const FALLBACK_MESSAGES = {
	feedback: {
		submitting: "Submitting…",
	},
};
const SUBMIT_FEEDBACK_FORM_SELECTOR =
	"form[data-submit-feedback], form.media-management__form, .media-management__candidate-actions form, .media-management__removal form";

/**
 * Marks one native form submission as pending without taking over navigation.
 * @param {HTMLFormElement | any} form
 * @param {HTMLButtonElement | HTMLInputElement | any} button
 * @param {(key: string, values?: Record<string, any>) => string} translate
 * @returns {boolean}
 */
export function setFormSubmissionPending(form, button, translate) {
	if (!form || !button || form.dataset?.submissionPending === "true") return false;

	const labelElement = button.querySelector?.(".shared-button__label");
	const currentLabel =
		labelElement?.textContent?.trim() ||
		(typeof button.value === "string"
			? button.value.trim()
			: button.textContent?.trim());
	const pendingLabel =
		button.dataset?.pendingLabel ||
		button.dataset?.loadingLabel ||
		(currentLabel ? `${currentLabel}…` : translate("feedback.submitting"));

	if (button.getBoundingClientRect && button.style) {
		const width = button.getBoundingClientRect().width;
		if (width > 0) button.style.minInlineSize = `${width}px`;
	}

	button.disabled = true;
	button.setAttribute?.("aria-disabled", "true");
	button.setAttribute?.("data-submit-pending", "true");
	if (labelElement) labelElement.textContent = pendingLabel;
	else if (typeof button.value === "string") button.value = pendingLabel;
	else if (typeof button.textContent === "string") button.textContent = pendingLabel;

	form.dataset.submissionPending = "true";
	form.setAttribute?.("aria-busy", "true");

	const status = getOrCreateStatus(form);
	if (status) {
		status.textContent = form.dataset.pendingMessage || pendingLabel;
	}

	return true;
}

/**
 * @param {Document | Element | any} [root]
 * @param {(key: string, values?: Record<string, any>) => string} [translate]
 */
export function initializeFormSubmissionFeedback(
	root = document,
	translate = createBrowserTranslator(root, FALLBACK_MESSAGES),
) {
	root.querySelectorAll?.(SUBMIT_FEEDBACK_FORM_SELECTOR).forEach((form) => {
		if (form.dataset.submitFeedbackInitialized === "true") return;
		form.dataset.submitFeedbackInitialized = "true";
		form.addEventListener("submit", (event) => {
			if (form.dataset.submissionPending === "true") {
				event.preventDefault();
				return;
			}
			const submitter =
				event.submitter ??
				form.querySelector(
					'button[type="submit"]:not(:disabled), input[type="submit"]:not(:disabled)',
				);
			setFormSubmissionPending(form, submitter, translate);
		});
	});
}

/** @param {HTMLFormElement | any} form @returns {HTMLElement | null} */
function getOrCreateStatus(form) {
	const existing = form.querySelector?.("[data-submit-status]");
	if (existing) return existing;

	const documentRef =
		form.ownerDocument ?? (typeof document !== "undefined" ? document : null);
	if (!documentRef?.createElement) return null;

	const status = documentRef.createElement("span");
	status.className = "visually-hidden";
	status.setAttribute("data-submit-status", "true");
	status.setAttribute("role", "status");
	status.setAttribute("aria-live", "polite");
	form.prepend(status);
	return status;
}
