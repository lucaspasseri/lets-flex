import pool from "../../../db/pool.js";
import * as usersRepository from "../users/repository.js";
import * as authIdentitiesRepository from "./authIdentitiesRepository.js";
import { readProviderEmail, readProviderSubject } from "./authenticateGoogleUser.js";

export class GoogleIdentityConflictError extends Error {
	constructor() {
		super("That Google account is already connected to another Let's Flex account.");
		this.name = "GoogleIdentityConflictError";
	}
}

export class GoogleProviderAlreadyLinkedError extends Error {
	constructor() {
		super("This account already has a different Google account connected.");
		this.name = "GoogleProviderAlreadyLinkedError";
	}
}

export class GoogleReplacementUnavailableError extends Error {
	constructor() {
		super(
			"Google account replacement requires both password and Google authentication.",
		);
		this.name = "GoogleReplacementUnavailableError";
	}
}

/**
 * Attaches Google's stable subject to an existing application user. Google
 * profile email is deliberately ignored: linking is authorized by the active
 * application session, not inferred from provider attributes.
 * @param {{userId: number, profile: any, intent?: "link" | "replace"}} input
 */
export default async function linkGoogleIdentity({ userId, profile, intent = "link" }) {
	const providerSubject = readProviderSubject(profile);
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const user = await usersRepository.findPrincipalByIdForUpdate({ userId }, client);
		if (!user || user.role === "guest" || !user.is_active) {
			throw new Error("The account is not available for Google linking.");
		}

		const subjectOwner = await authIdentitiesRepository.findPrincipalByProviderSubject(
			{ provider: "google", providerSubject },
			client,
		);
		const identities = await authIdentitiesRepository.findByUserId({ userId }, client);
		const currentGoogle = identities.find((identity) => identity.provider === "google");

		if (
			subjectOwner?.id === userId &&
			currentGoogle?.provider_subject === providerSubject
		) {
			await client.query("COMMIT");
			return user;
		}
		if (subjectOwner) throw new GoogleIdentityConflictError();

		if (intent === "replace") {
			if (
				!currentGoogle ||
				!identities.some((identity) => identity.provider === "local")
			) {
				throw new GoogleReplacementUnavailableError();
			}
			const providerEmail = readProviderEmail(profile);
			const replaced = await authIdentitiesRepository.replaceGoogle(
				{ userId, providerSubject, providerEmail },
				client,
			);
			if (!replaced) throw new GoogleReplacementUnavailableError();
		} else {
			if (currentGoogle) throw new GoogleProviderAlreadyLinkedError();
			const providerEmail = readProviderEmail(profile);
			await authIdentitiesRepository.createGoogle(
				{ userId, providerSubject, providerEmail },
				client,
			);
		}
		await client.query("COMMIT");
		return user;
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "23505"
		) {
			const owner = await authIdentitiesRepository.findPrincipalByProviderSubject({
				provider: "google",
				providerSubject,
			});
			if (owner?.id === userId) {
				return usersRepository.findPrincipalById({ userId });
			}
			if (owner) throw new GoogleIdentityConflictError();
			const identities = await authIdentitiesRepository.findByUserId({ userId });
			if (identities.some((identity) => identity.provider === "google")) {
				throw new GoogleProviderAlreadyLinkedError();
			}
			throw error;
		}
		throw error;
	} finally {
		client.release();
	}
}
