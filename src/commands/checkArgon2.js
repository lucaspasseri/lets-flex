import { hashPassword, verifyPassword } from "../features/auth/passwordService.js";

const password = "argon2 deployment compatibility check";
const hash = await hashPassword(password);
if (!(await verifyPassword(hash, password))) {
	throw new Error("Argon2id compatibility check failed");
}
console.log(
	`Argon2id check passed on Node ${process.version} ${process.platform}/${process.arch}.`,
);
