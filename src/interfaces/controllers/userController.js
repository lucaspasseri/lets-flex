import createUser from "../../features/users/createUser.js";
import asyncHandler from "../../../utils/asyncControllerHandler.js";

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").Response} Response
 * @typedef {import("../../features/users/users.types.js").CreateUserInput} CreateUserInput
 * @typedef {import("../../features/users/users.types.js").User} User
 * @typedef {Request & {validatedBody: CreateUserInput}} ValidatedCreateUserRequest
 * @typedef {(input: CreateUserInput) => Promise<{id: User["id"]} | null>} CreateUserAccount
 */

/**
 * Creates the successful-path HTTP handler. Dependency injection keeps the
 * controller behavior testable without coupling tests to the repository.
 *
 * @param {CreateUserAccount} [createUserAccount]
 * @returns {(req: ValidatedCreateUserRequest, res: Response) => Promise<void>}
 */
export function buildCreateUserHandler(createUserAccount = createUser) {
	return async function create(req, res) {
		const user = await createUserAccount(req.validatedBody);

		// @ts-ignore
		req.session.state = { userId: user?.id ?? null };
		res.redirect("/profile");
	};
}

const create = buildCreateUserHandler();

/**
 * @param {Request} req
 * @param {Response} res
 */

async function reset(req, res) {
	// @ts-ignore
	delete req.session.state;

	const { backUrl, backUrlWithoutParams } = res.locals.page;
	if (backUrlWithoutParams === "/profile/") {
		res.redirect(backUrlWithoutParams);
		return;
	}

	res.redirect(backUrl);
}

export const userController = {
	create: asyncHandler(create),
	reset,
};
