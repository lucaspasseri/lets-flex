import asyncHandler from "../../../utils/asyncControllerHandler.js";
import { respondWithApplicationRecovery } from "../applicationRecovery.js";
import getTranslationOverview from "../../features/translationMaintenance/getTranslationOverview.js";
import getTranslationRecord from "../../features/translationMaintenance/getTranslationRecord.js";
import updateTranslation, {
	TranslationMaintenanceNotFoundError,
} from "../../features/translationMaintenance/updateTranslation.js";
import createTranslationMaintenancePageViewModel from "../../../views/viewModels/translationMaintenance/createTranslationMaintenancePageViewModel.js";
import createTranslationEditPageViewModel from "../../../views/viewModels/translationMaintenance/createTranslationEditPageViewModel.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/**
 * @typedef {import("express").Request & {validatedQuery?: Record<string, unknown>, validatedParams?: {entityType: string, entityId: number}, validatedBody?: {locale: string, name: string}}} TranslationMaintenanceRequest
 */

/** @param {TranslationMaintenanceRequest} req @param {import("express").Response} res */
async function showOverview(req, res) {
	const overview = await getTranslationOverview(req.validatedQuery ?? {});
	res.render(
		"translationMaintenance/index",
		createTranslationMaintenancePageViewModel({
			page: {
				...res.locals.page,
				title: res.locals.t("translationMaintenance.pageTitle"),
			},
			currentUser: res.locals.authUser ?? null,
			overview,
			translate: res.locals.t,
		}),
	);
}

/**
 * @param {TranslationMaintenanceRequest} req
 * @param {import("express").Response} res
 * @param {{formState?: Record<string, any>, pageFeedback?: Record<string, string> | null}} [state]
 */
async function renderEditor(req, res, state = {}) {
	const params = req.validatedParams;
	if (!params)
		throw new Error("Translation maintenance route parameters were not validated.");
	const { entityType, entityId } = params;
	const record = await getTranslationRecord({ entityType, entityId });
	if (!record) {
		respondWithApplicationRecovery(req, res, { kind: "notFound" });
		return;
	}

	const t = (key, defaultValue, values) =>
		translateMessage(
			res.locals?.t,
			`translationMaintenance.${key}`,
			defaultValue,
			values,
		);
	res.render(
		"translationMaintenance/edit",
		createTranslationEditPageViewModel({
			page: {
				...res.locals.page,
				title: t("editPageTitle", "Edit translation · Let's Flex!"),
			},
			currentUser: res.locals.authUser ?? null,
			record,
			formState: state.formState,
			pageFeedback: state.pageFeedback ?? null,
			savedLocale:
				req.query?.saved === "en" || req.query?.saved === "pt-BR"
					? req.query.saved
					: null,
			translate: res.locals.t,
		}),
	);
}

/** @param {TranslationMaintenanceRequest} req @param {import("express").Response} res */
async function showEditor(req, res) {
	await renderEditor(req, res);
}

/** @param {TranslationMaintenanceRequest} req @param {import("express").Response} res */
async function update(req, res) {
	const params = req.validatedParams;
	const body = req.validatedBody;
	if (!params || !body)
		throw new Error("Translation maintenance request was not validated.");
	const { entityType, entityId } = params;
	try {
		await updateTranslation({
			entityType,
			entityId,
			...body,
		});
	} catch (error) {
		if (error instanceof TranslationMaintenanceNotFoundError) {
			respondWithApplicationRecovery(req, res, { kind: "notFound" });
			return;
		}
		throw error;
	}

	res.redirect(
		`/admin/translations/${encodeURIComponent(entityType)}/${entityId}?saved=${encodeURIComponent(body.locale)}`,
	);
}

/**
 * @param {TranslationMaintenanceRequest} req
 * @param {import("express").Response} res
 * @param {{errors: {fieldErrors: Record<string, string>, formErrors: string[]}, submittedValues: unknown}} result
 */
async function showUpdateErrors(req, res, { errors, submittedValues }) {
	const values =
		submittedValues && typeof submittedValues === "object"
			? /** @type {Record<string, any>} */ (submittedValues)
			: {};
	const locale =
		values.locale === "pt-BR" ? "pt-BR" : values.locale === "en" ? "en" : null;
	const errorMessage = errors.formErrors[0] ?? errors.fieldErrors.locale ?? null;
	res.status(422);
	await renderEditor(req, res, {
		formState: {
			locale,
			values,
			errors,
		},
		pageFeedback: errorMessage
			? {
					id: "translation-edit-feedback-title",
					title:
						res.locals?.t?.("translationMaintenance.updateFailed", {
							defaultValue: "Translation not saved",
						}) ?? "Translation not saved",
					message: errorMessage,
				}
			: null,
	});
}

export const translationMaintenanceController = {
	showOverview: asyncHandler(showOverview),
	showEditor: asyncHandler(showEditor),
	update: asyncHandler(update),
	showUpdateErrors,
};
