import asyncHandler from "../../../utils/asyncControllerHandler.js";
import addPasswordIdentity, {
	LocalIdentityAlreadyExistsError,
} from "../../features/auth/addPasswordIdentity.js";
import getAuthenticationMethods from "../../features/auth/getAuthenticationMethods.js";
import * as usersRepository from "../../features/users/repository.js";
import * as userMapper from "../../features/users/mapper.js";
import createAuthenticationMethodsViewModel from "../../../views/viewModels/profilePage/createAuthenticationMethodsViewModel.js";
import establishAuthenticatedSession from "../auth/establishAuthenticatedSession.js";
import { respondWithApplicationRecovery } from "../applicationRecovery.js";
import { addPasswordSchema } from "../validation/authSchemas.js";
import { formatLocaleDate } from "../../infrastructure/i18n/formatLocale.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";
import translateAuthErrors from "../validation/translateAuthErrors.js";

function profileMessage(res, key, defaultValue) {
	return translateMessage(res.locals?.t, `profile.${key}`, defaultValue);
}

/** @param {import("express").Request} req @param {import("express").Response} res @param {{passwordErrors?: string[]}} [state] */
async function renderProfile(req, res, state = {}) {
	const t = (key, defaultValue) => profileMessage(res, key, defaultValue);
	// @ts-ignore -- application Passport principal.
	const row = await usersRepository.findById({ userId: req.user?.id ?? null });
	if (!row) {
		respondWithApplicationRecovery(req, res, { kind: "authentication" });
		return;
	}
	const currentUser = userMapper.toLoggedUser(row);
	const expirationLabel =
		currentUser.role === "guest" && currentUser.guestExpiresAt
			? formatLocaleDate(currentUser.guestExpiresAt, res.locals.language, {
					dateStyle: "long",
				})
			: null;
	const authenticationMethods = createAuthenticationMethodsViewModel(
		await getAuthenticationMethods({ userId: row.id }),
		res.locals.t,
	);
	const googleLinkMessages = {
		connected: {
			type: "success",
			text: t("googleConnected", "Google is now connected to this account."),
		},
		conflict: {
			type: "error",
			text: t(
				"googleConflict",
				"That Google account is already connected to another Let's Flex account.",
			),
		},
		"already-connected": {
			type: "error",
			text: t(
				"googleAlreadyConnected",
				"This account already has a different Google account connected.",
			),
		},
		replaced: {
			type: "success",
			text: t("googleReplaced", "The connected Google account was changed."),
		},
		invalid: {
			type: "error",
			text: t("googleInvalid", "Google did not provide a usable verified email."),
		},
		"replacement-unavailable": {
			type: "error",
			text: t(
				"googleReplacementUnavailable",
				"Add a password before changing the connected Google account.",
			),
		},
	};
	res.render("profile", {
		page: { ...res.locals.page, title: t("pageTitle", "Profile · Let's Flex!") },
		shell: { currentUser, activeNavigation: "profile" },
		currentUser,
		expirationLabel,
		authenticationMethods,
		googleLinkMessage: googleLinkMessages[req.query?.googleLink] ?? null,
		passwordMessage:
			req.query?.password === "added"
				? {
						type: "success",
						text: t("passwordConnected", "Password authentication is now connected."),
					}
				: null,
		passwordErrors: state.passwordErrors ?? [],
	});
}

/** @param {import("express").Request} req @param {import("express").Response} res */
async function show(req, res) {
	await renderProfile(req, res);
}

/** @param {import("express").Request} req @param {import("express").Response} res */
async function addPassword(req, res) {
	const parsed = addPasswordSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(422);
		await renderProfile(req, res, {
			passwordErrors: translateAuthErrors(res, parsed.error.issues),
		});
		return;
	}
	try {
		const principal = /** @type {any} */ (req.user);
		const user = await addPasswordIdentity({
			userId: principal.id,
			password: parsed.data.password,
		});
		await establishAuthenticatedSession(req, user);
		res.redirect("/profile?password=added");
	} catch (error) {
		if (error instanceof LocalIdentityAlreadyExistsError) {
			res.status(409);
			await renderProfile(req, res, {
				passwordErrors: [
					profileMessage(
						res,
						"passwordAlreadyExists",
						"A password is already set for this account.",
					),
				],
			});
			return;
		}
		throw error;
	}
}

export const profileController = {
	show: asyncHandler(show),
	addPassword: asyncHandler(addPassword),
};
