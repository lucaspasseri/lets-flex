import { createHash, randomBytes } from "node:crypto";
import pool from "../../../db/pool.js";
import normalizeEmail from "./normalizeEmail.js";
import { hashPassword } from "./passwordService.js";
import * as repository from "./passwordResetRepository.js";

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export class InvalidPasswordResetTokenError extends Error {
	constructor() {
		super("This password reset link is invalid or has expired.");
		this.name = "InvalidPasswordResetTokenError";
	}
}

export function hashResetToken(token) {
	return createHash("sha256").update(token).digest("hex");
}

export function readPasswordResetConfiguration(environment = process.env) {
	const ttlMs = Number(environment.PASSWORD_RESET_TTL_MS || DEFAULT_TTL_MS);
	if (!Number.isFinite(ttlMs) || ttlMs <= 0)
		throw new Error("PASSWORD_RESET_TTL_MS must be positive");
	const base = environment.APP_BASE_URL?.trim();
	if (!base)
		throw new Error("APP_BASE_URL is required for password reset email delivery");
	const url = new URL(base);
	if (!new Set(["http:", "https:"]).has(url.protocol) || url.username || url.password) {
		throw new Error("APP_BASE_URL must be a trusted absolute HTTP(S) URL");
	}
	return { ttlMs, baseUrl: url.toString() };
}

function validToken(token) {
	return typeof token === "string" && TOKEN_PATTERN.test(token);
}

export async function requestPasswordReset({
	email,
	emailService,
	environment = process.env,
}) {
	const normalizedEmail = normalizeEmail(email);
	const client = await pool.connect();
	/** @type {{to: string, resetUrl: string, expiresInMs: number} | null} */
	let delivery = null;
	try {
		await client.query("BEGIN");
		const identity = await repository.findEligibleLocalIdentityForUpdate(
			{ email: normalizedEmail },
			client,
		);
		if (identity) {
			const { ttlMs, baseUrl } = readPasswordResetConfiguration(environment);
			const token = randomBytes(32).toString("base64url");
			await repository.invalidateActive({ identityId: identity.id }, client);
			await repository.create(
				{
					identityId: identity.id,
					tokenHash: hashResetToken(token),
					expiresAt: new Date(Date.now() + ttlMs),
				},
				client,
			);
			const resetUrl = new URL("/auth/password-reset", baseUrl);
			resetUrl.searchParams.set("token", token);
			delivery = {
				to: identity.email,
				resetUrl: resetUrl.toString(),
				expiresInMs: ttlMs,
			};
		}
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		throw error;
	} finally {
		client.release();
	}
	if (delivery) await emailService.sendPasswordReset(delivery);
}

export async function isPasswordResetTokenUsable(token) {
	return validToken(token) && repository.isUsable({ tokenHash: hashResetToken(token) });
}

export async function resetPassword({ token, password }) {
	if (!validToken(token)) throw new InvalidPasswordResetTokenError();
	const passwordHash = await hashPassword(password);
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const record = await repository.findUsableForUpdate(
			{ tokenHash: hashResetToken(token) },
			client,
		);
		if (!record) throw new InvalidPasswordResetTokenError();
		await repository.updatePassword(
			{ identityId: record.auth_identity_id, passwordHash },
			client,
		);
		await repository.invalidateActive({ identityId: record.auth_identity_id }, client);
		await repository.invalidateUserSessions({ userId: record.user_id }, client);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		throw error;
	} finally {
		client.release();
	}
}
