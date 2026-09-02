import { z } from "zod";
import normalizeEmail from "../../features/auth/normalizeEmail.js";
import { MAX_PASSWORD_BYTES } from "../../features/auth/passwordService.js";

const emailSchema = z.preprocess(
	normalizeEmail,
	z.string().email("Enter a valid email address.").max(254),
);

export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Enter your password.").max(256),
	returnTo: z.string().optional().default("/"),
});

export const passwordSchema = z
	.string()
	.min(12, "Password must contain at least 12 characters.")
	.refine(
		(value) => Buffer.byteLength(value, "utf8") <= MAX_PASSWORD_BYTES,
		"Password is too long.",
	);

export const registrationSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	returnTo: z.string().optional().default("/"),
});

export const addPasswordSchema = z
	.object({ password: passwordSchema, confirmPassword: z.string() })
	.refine((value) => value.password === value.confirmPassword, {
		message: "Passwords must match.",
		path: ["confirmPassword"],
	});

export function safeReturnTo(value) {
	if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
		return "/";
	}
	return value;
}
