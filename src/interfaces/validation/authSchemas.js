import { z } from "zod";
import normalizeEmail from "../../features/auth/normalizeEmail.js";

export const loginSchema = z.object({
	email: z.preprocess(
		normalizeEmail,
		z.string().email("Enter a valid email address.").max(254),
	),
	password: z.string().min(1, "Enter your password.").max(256),
	returnTo: z.string().optional().default("/"),
});

export function safeReturnTo(value) {
	if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
		return "/";
	}
	return value;
}
