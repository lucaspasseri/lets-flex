import passportPackage from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import authenticateGoogleUser from "../features/auth/authenticateGoogleUser.js";
import * as authIdentitiesRepository from "../features/auth/authIdentitiesRepository.js";
import normalizeEmail from "../features/auth/normalizeEmail.js";
import { verifyPassword } from "../features/auth/passwordService.js";
import * as usersRepository from "../features/users/repository.js";

/** @param {any} row */
function toPrincipal(row) {
	return {
		id: row.id,
		email: row.email ?? null,
		name: row.name,
		role: row.role,
		guestExpiresAt: row.guest_expires_at ?? null,
	};
}

/** @param {any} row @param {Date} [now] */
function isUsablePrincipal(row, now = new Date()) {
	if (!row?.is_active) return false;
	if (row.role !== "guest") return true;
	return row.guest_expires_at && new Date(row.guest_expires_at) > now;
}

/** @param {NodeJS.ProcessEnv} [environment] */
function readGoogleConfiguration(environment = process.env) {
	const clientID = environment.GOOGLE_CLIENT_ID?.trim();
	const clientSecret = environment.GOOGLE_CLIENT_SECRET?.trim();
	const callbackURL = environment.GOOGLE_CALLBACK_URL?.trim();
	if (!clientID || !clientSecret || !callbackURL) {
		throw new Error(
			"GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are required",
		);
	}
	let parsedCallback;
	try {
		parsedCallback = new URL(callbackURL);
	} catch {
		throw new Error("GOOGLE_CALLBACK_URL must be an absolute HTTP(S) URL");
	}
	if (!new Set(["http:", "https:"]).has(parsedCallback.protocol)) {
		throw new Error("GOOGLE_CALLBACK_URL must be an absolute HTTP(S) URL");
	}
	return { clientID, clientSecret, callbackURL: parsedCallback.toString() };
}

export function createPassport() {
	const passport = new passportPackage.Passport();
	passport.use(
		new LocalStrategy(
			{ usernameField: "email", passwordField: "password" },
			async (email, password, done) => {
				try {
					const account = await authIdentitiesRepository.findLocalByEmail({
						email: normalizeEmail(email),
					});
					if (
						!account ||
						account.role === "guest" ||
						!isUsablePrincipal(account) ||
						!(await verifyPassword(account.password_hash, password))
					) {
						done(null, false, { message: "Invalid email or password." });
						return;
					}
					done(null, toPrincipal(account));
				} catch (error) {
					done(error);
				}
			},
		),
	);
	passport.use(
		new GoogleStrategy(
			{
				...readGoogleConfiguration(),
				passReqToCallback: true,
			},
			async (req, _accessToken, _refreshToken, profile, done) => {
				try {
					const principal = /** @type {any} */ (req.user);
					const account = await authenticateGoogleUser({
						profile,
						guestUserId:
							principal?.role === "guest" && Number.isInteger(principal.id)
								? principal.id
								: null,
					});
					if (account.role === "guest" || !isUsablePrincipal(account)) {
						done(null, false, { message: "This account is not available." });
						return;
					}
					done(null, toPrincipal(account));
				} catch (error) {
					done(error);
				}
			},
		),
	);

	// @ts-ignore -- application principal extends Passport's empty User interface.
	passport.serializeUser((user, done) => done(null, user.id));
	passport.deserializeUser(async (id, done) => {
		try {
			const account = await usersRepository.findPrincipalById({ userId: Number(id) });
			if (!isUsablePrincipal(account)) {
				done(null, false);
				return;
			}
			done(null, toPrincipal(account));
		} catch (error) {
			done(error);
		}
	});
	return passport;
}

export { isUsablePrincipal, readGoogleConfiguration, toPrincipal };
