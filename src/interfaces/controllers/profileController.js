import asyncHandler from "../../../utils/asyncControllerHandler.js";
import addPasswordIdentity, {
	LocalIdentityAlreadyExistsError,
} from "../../features/auth/addPasswordIdentity.js";
import getAuthenticationMethods from "../../features/auth/getAuthenticationMethods.js";
import * as usersRepository from "../../features/users/repository.js";
import * as userMapper from "../../features/users/mapper.js";
import createAuthenticationMethodsViewModel from "../../../views/viewModels/profilePage/createAuthenticationMethodsViewModel.js";
import establishAuthenticatedSession from "../auth/establishAuthenticatedSession.js";
import { addPasswordSchema } from "../validation/authSchemas.js";

/** @param {import("express").Request} req @param {import("express").Response} res @param {{passwordErrors?: string[]}} [state] */
async function renderProfile(req, res, state = {}) {
	// @ts-ignore -- application Passport principal.
	const row = await usersRepository.findById({ userId: req.user?.id ?? null });
	if (!row) {
		res.status(401).send("Authentication required");
		return;
	}
	const currentUser = userMapper.toLoggedUser(row);
	const authenticationMethods = createAuthenticationMethodsViewModel(
		await getAuthenticationMethods({ userId: row.id }),
	);
	const googleLinkMessages = {
		connected: { type: "success", text: "Google is now connected to this account." },
		conflict: {
			type: "error",
			text: "That Google account is already connected to another Let's Flex account.",
		},
		"already-connected": {
			type: "error",
			text: "This account already has a different Google account connected.",
		},
		replaced: { type: "success", text: "The connected Google account was changed." },
		invalid: { type: "error", text: "Google did not provide a usable verified email." },
		"replacement-unavailable": {
			type: "error",
			text: "Add a password before changing the connected Google account.",
		},
	};
	res.render("profile", {
		page: { ...res.locals.page, title: "Profile · Let's Flex!" },
		shell: { currentUser, activeNavigation: "profile" },
		currentUser,
		authenticationMethods,
		googleLinkMessage: googleLinkMessages[req.query?.googleLink] ?? null,
		passwordMessage:
			req.query?.password === "added"
				? { type: "success", text: "Password authentication is now connected." }
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
			passwordErrors: parsed.error.issues.map((issue) => issue.message),
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
			await renderProfile(req, res, { passwordErrors: [error.message] });
			return;
		}
		throw error;
	}
}

export const profileController = {
	show: asyncHandler(show),
	addPassword: asyncHandler(addPassword),
};
