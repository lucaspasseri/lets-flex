import passportPackage from "passport";
import { Strategy as LocalStrategy } from "passport-local";
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

export function createPassport() {
	const passport = new passportPackage.Passport();
	passport.use(
		new LocalStrategy(
			{ usernameField: "email", passwordField: "password" },
			async (email, password, done) => {
				try {
					const account = await usersRepository.findForAuthenticationByEmail({
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

export { isUsablePrincipal, toPrincipal };
