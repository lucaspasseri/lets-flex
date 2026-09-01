import { hashPassword } from "./passwordService.js";
import * as usersRepository from "../users/repository.js";

/** @param {{email: string, password: string}} input */
export default async function registerUser({ email, password }) {
	const passwordHash = await hashPassword(password);
	return usersRepository.createRegisteredUser({
		email,
		passwordHash,
		name: email.slice(0, email.lastIndexOf("@")),
	});
}
