import argon2 from "argon2";

const MAX_PASSWORD_BYTES = 256;

/** @param {string} password */
function assertValidPassword(password) {
	if (typeof password !== "string" || password.length < 12) {
		throw new TypeError("Password must contain at least 12 characters");
	}
	if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
		throw new TypeError("Password is too long");
	}
}

/** @param {string} password */
export async function hashPassword(password) {
	assertValidPassword(password);
	return argon2.hash(password, { type: argon2.argon2id });
}

/** @param {string} hash @param {string} password */
export async function verifyPassword(hash, password) {
	if (typeof hash !== "string" || typeof password !== "string") return false;
	if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) return false;

	try {
		return await argon2.verify(hash, password);
	} catch {
		return false;
	}
}

export { MAX_PASSWORD_BYTES };
