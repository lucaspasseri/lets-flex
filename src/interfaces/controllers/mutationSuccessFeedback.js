import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/**
 * Creates the shared page-feedback shape for a successful native mutation redirect.
 * Unknown operations intentionally return no feedback so query parameters cannot
 * become arbitrary page copy.
 *
 * @param {unknown} translate
 * @param {string} operation
 * @param {Record<string, {titleKey: string, title: string, messageKey: string, message: string}>} messages
 * @param {string} id
 */
export default function createMutationSuccessFeedback(
	translate,
	operation,
	messages,
	id,
) {
	const copy = messages[operation];
	if (!copy) return null;

	return {
		tone: "success",
		id,
		eyebrow: translateMessage(translate, "feedback.successEyebrow", "Success"),
		title: translateMessage(translate, copy.titleKey, copy.title),
		message: translateMessage(translate, copy.messageKey, copy.message),
	};
}
