import { z } from "zod";
import pool from "../../../db/pool.js";
import normalizeEmail from "./normalizeEmail.js";
import * as authIdentitiesRepository from "./authIdentitiesRepository.js";
import createOrConvertRegisteredUser from "./createOrConvertRegisteredUser.js";

export class GoogleProfileError extends Error {
	/** @param {string} message */
	constructor(message) {
		super(message);
		this.name = "GoogleProfileError";
	}
}

export class GoogleEmailConflictError extends Error {
	constructor() {
		super(
			"An account with that email address already exists. Sign in using its existing authentication method.",
		);
		this.name = "GoogleEmailConflictError";
	}
}

const emailSchema = z.string().email().max(254);

/** @param {any} profile */
function readProviderSubject(profile) {
	const subject = typeof profile?.id === "string" ? profile.id.trim() : "";
	if (!subject || subject.length > 255) {
		throw new GoogleProfileError(
			"Google did not provide a valid account identifier. Please try again.",
		);
	}
	return subject;
}

/** @param {any} profile */
function readRegistrationProfile(profile) {
	const verifiedEmail = profile?.emails?.find(
		/** @param {any} entry */ (entry) => entry?.verified === true,
	);
	const email = normalizeEmail(verifiedEmail?.value);
	if (!emailSchema.safeParse(email).success) {
		throw new GoogleProfileError(
			"Google did not provide a usable verified email address. No account was created.",
		);
	}

	const suppliedName =
		typeof profile?.displayName === "string" ? profile.displayName.trim() : "";
	const fallbackName = email.slice(0, email.lastIndexOf("@"));
	return { email, name: (suppliedName || fallbackName).slice(0, 100) };
}

/**
 * Resolves an existing Google subject, or atomically creates/converts a user
 * and attaches that subject. Access and refresh tokens never enter this boundary.
 * @param {{profile: any, guestUserId?: number | null}} input
 */
export default async function authenticateGoogleUser({ profile, guestUserId = null }) {
	const providerSubject = readProviderSubject(profile);
	const existing = await authIdentitiesRepository.findPrincipalByProviderSubject({
		provider: "google",
		providerSubject,
	});
	if (existing) return existing;

	const { email, name } = readRegistrationProfile(profile);
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const user = await createOrConvertRegisteredUser(
			{ email, name, guestUserId },
			client,
		);
		await authIdentitiesRepository.createGoogle(
			{ userId: user.id, providerSubject },
			client,
		);
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
			const concurrentlyCreated =
				await authIdentitiesRepository.findPrincipalByProviderSubject({
					provider: "google",
					providerSubject,
				});
			if (concurrentlyCreated) return concurrentlyCreated;
			throw new GoogleEmailConflictError();
		}
		throw error;
	} finally {
		client.release();
	}
}

export { readProviderSubject, readRegistrationProfile };
