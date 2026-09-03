import assert from "node:assert/strict";
import test from "node:test";
import normalizeEmail from "./normalizeEmail.js";
import {
	GoogleProfileError,
	readProviderSubject,
	readRegistrationProfile,
} from "./authenticateGoogleUser.js";
import { hashPassword, verifyPassword } from "./passwordService.js";
import { readPasswordResetConfiguration } from "./passwordResetService.js";
import { readGoogleConfiguration } from "../../config/passport.js";
import {
	addPasswordSchema,
	registrationSchema,
	safeReturnTo,
} from "../../interfaces/validation/authSchemas.js";

test("email normalization is stable", () => {
	assert.equal(normalizeEmail("  Person@Example.COM "), "person@example.com");
	assert.equal(normalizeEmail(null), "");
});

test("adding a password reuses password requirements and requires confirmation", () => {
	assert.deepEqual(
		addPasswordSchema.parse({
			password: "a sufficiently long password",
			confirmPassword: "a sufficiently long password",
		}),
		{
			password: "a sufficiently long password",
			confirmPassword: "a sufficiently long password",
		},
	);
	assert.equal(
		addPasswordSchema.safeParse({ password: "short", confirmPassword: "short" })
			.success,
		false,
	);
	assert.equal(
		addPasswordSchema.safeParse({
			password: "a sufficiently long password",
			confirmPassword: "a different long password",
		}).success,
		false,
	);
});

test("Argon2id hashes verify without exposing plaintext", async () => {
	const password = "correct horse battery staple";
	const hash = await hashPassword(password);
	assert.notEqual(hash, password);
	assert.equal(await verifyPassword(hash, password), true);
	assert.equal(await verifyPassword(hash, "incorrect password"), false);
});

test("post-authentication redirects stay local", () => {
	assert.equal(safeReturnTo("/programs?programId=2"), "/programs?programId=2");
	assert.equal(safeReturnTo("//evil.example"), "/");
	assert.equal(safeReturnTo("https://evil.example"), "/");
});

test("registration normalizes email, rejects weak passwords, and strips extra fields", () => {
	const valid = registrationSchema.parse({
		email: "  Person@Example.COM ",
		password: "a sufficiently long password",
		role: "admin",
	});
	assert.deepEqual(valid, {
		email: "person@example.com",
		password: "a sufficiently long password",
		returnTo: "/",
	});
	assert.equal(
		registrationSchema.safeParse({ email: "person@example.com", password: "short" })
			.success,
		false,
	);
});

test("Google profiles use sub and require a verified usable email for registration", () => {
	const profile = {
		id: "google-sub-123",
		displayName: "  Google Member  ",
		emails: [{ value: "  MEMBER@EXAMPLE.COM ", verified: true }],
	};
	assert.equal(readProviderSubject(profile), "google-sub-123");
	assert.deepEqual(readRegistrationProfile(profile), {
		email: "member@example.com",
		name: "Google Member",
	});
	assert.throws(
		() =>
			readRegistrationProfile({
				id: "google-sub-456",
				emails: [{ value: "member@example.com", verified: false }],
			}),
		GoogleProfileError,
	);
});

test("Google OAuth configuration is required and callback URLs must be absolute", () => {
	assert.deepEqual(
		readGoogleConfiguration({
			GOOGLE_CLIENT_ID: "client-id",
			GOOGLE_CLIENT_SECRET: "client-secret",
			GOOGLE_CALLBACK_URL: "http://localhost:3000/auth/google/callback",
		}),
		{
			clientID: "client-id",
			clientSecret: "client-secret",
			callbackURL: "http://localhost:3000/auth/google/callback",
		},
	);
	assert.throws(() => readGoogleConfiguration({}), /are required/);
	assert.throws(
		() =>
			readGoogleConfiguration({
				GOOGLE_CLIENT_ID: "client-id",
				GOOGLE_CLIENT_SECRET: "client-secret",
				GOOGLE_CALLBACK_URL: "/auth/google/callback",
			}),
		/absolute HTTP\(S\) URL/,
	);
});

test("password reset configuration requires a trusted HTTP(S) base URL and positive lifetime", () => {
	assert.deepEqual(
		readPasswordResetConfiguration({
			APP_BASE_URL: "https://paxeri.dev",
			PASSWORD_RESET_TTL_MS: "1800000",
		}),
		{ baseUrl: "https://paxeri.dev/", ttlMs: 1800000 },
	);
	assert.throws(() => readPasswordResetConfiguration({}), /APP_BASE_URL is required/);
	assert.throws(
		() => readPasswordResetConfiguration({ APP_BASE_URL: "ftp://paxeri.dev" }),
		/trusted absolute HTTP\(S\) URL/,
	);
	assert.throws(
		() =>
			readPasswordResetConfiguration({
				APP_BASE_URL: "https://user:password@paxeri.dev",
			}),
		/trusted absolute HTTP\(S\) URL/,
	);
	assert.throws(
		() =>
			readPasswordResetConfiguration({
				APP_BASE_URL: "https://paxeri.dev",
				PASSWORD_RESET_TTL_MS: "0",
			}),
		/must be positive/,
	);
});
