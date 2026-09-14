import { z } from "zod";
import normalizeEmail from "../../features/auth/normalizeEmail.js";
import { MAX_PASSWORD_BYTES } from "../../features/auth/passwordService.js";

const emailSchema = z.preprocess(
	normalizeEmail,
	z
		.string()
		.email("Enter a valid email address.")
		.max(254, "Enter a valid email address."),
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

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const passwordResetSchema = z
	.object({ token: z.string(), password: passwordSchema, confirmPassword: z.string() })
	.refine((value) => value.password === value.confirmPassword, {
		message: "Passwords must match.",
		path: ["confirmPassword"],
	});

export function safeReturnTo(value) {
	const containsControlCharacter =
		typeof value === "string" &&
		[...value].some((character) => {
			const code = character.charCodeAt(0);
			return code < 32 || code === 127;
		});
	if (
		typeof value !== "string" ||
		!value.startsWith("/") ||
		value.startsWith("//") ||
		value.startsWith("/\\") ||
		containsControlCharacter
	) {
		return "/";
	}

	try {
		const parsed = new URL(value, "http://localhost");
		if (parsed.origin !== "http://localhost") return "/";
	} catch {
		return "/";
	}

	return value;
}
