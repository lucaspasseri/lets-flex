import { Resend } from "resend";
import { formatLocaleNumber } from "../i18n/formatLocale.js";
import { i18n, isSupportedLocale } from "../i18n/i18n.js";

const EMAIL_PATTERN = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const DISPLAY_EMAIL_PATTERN = /^.+<([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>$/;

export class EmailDeliveryError extends Error {
	constructor(category, providerRequestId) {
		super(`Password reset email delivery failed (${category})`);
		this.name = "EmailDeliveryError";
		this.category = category;
		this.providerRequestId = providerRequestId;
	}
}

export function readResendConfiguration(environment = process.env) {
	const apiKey = environment.RESEND_API_KEY?.trim();
	if (!apiKey) throw new Error("RESEND_API_KEY is required for email delivery");

	const from = environment.AUTH_EMAIL_FROM?.trim();
	if (!from) throw new Error("AUTH_EMAIL_FROM is required for email delivery");
	const displayMatch = from.match(DISPLAY_EMAIL_PATTERN);
	const mailbox = displayMatch?.[1] ?? from.split(/\s+/).at(-1);
	if (!mailbox || !EMAIL_PATTERN.test(mailbox)) {
		throw new Error("AUTH_EMAIL_FROM must contain a valid email address");
	}

	return { apiKey, from };
}

function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function describeLifetime(expiresInMs, translate, language) {
	const minutes = Math.max(1, Math.round(expiresInMs / 60_000));
	return translate("email.passwordResetLifetime", {
		count: minutes,
		minutes: formatLocaleNumber(minutes, language),
		defaultValue: "Use this link within {{minutes}} minutes:",
	});
}

function safeProviderRequestId(response) {
	const requestId = response?.error?.requestId;
	return typeof requestId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(requestId)
		? requestId
		: undefined;
}

export default class ResendEmailService {
	constructor({ client, from }) {
		this.client = client;
		this.from = from;
	}

	async sendPasswordReset({ to, resetUrl, expiresInMs, language = "en" }) {
		const locale = isSupportedLocale(language) ? language : "en";
		const translate = i18n.getFixedT(locale);
		const lifetime = describeLifetime(expiresInMs, translate, locale);
		const text = [
			translate("email.passwordResetIntro", {
				defaultValue: "Reset your Let’s Flex password",
			}),
			"",
			lifetime,
			resetUrl,
			"",
			translate("email.passwordResetIgnore", {
				defaultValue:
					"If you did not request a password reset, you can ignore this email.",
			}),
		].join("\n");
		const escapedUrl = escapeHtml(resetUrl);
		const html = `<h1>${translate("email.passwordResetIntro", { defaultValue: "Reset your Let’s Flex password" })}</h1><p>${lifetime}</p><p><a href="${escapedUrl}">${translate("email.passwordResetLink", { defaultValue: "Reset password" })}</a></p><p>${translate("email.passwordResetIgnore", { defaultValue: "If you did not request a password reset, you can ignore this email." })}</p>`;

		let response;
		try {
			response = await this.client.emails.send({
				from: this.from,
				to,
				subject: translate("email.passwordResetSubject", {
					defaultValue: "Reset your Let’s Flex password",
				}),
				text,
				html,
			});
		} catch (_error) {
			throw new EmailDeliveryError("transport_failure");
		}
		if (response.error || !response.data?.id) {
			throw new EmailDeliveryError(
				"provider_rejected",
				safeProviderRequestId(response),
			);
		}
	}
}

export function createResendEmailService(environment = process.env) {
	const { apiKey, from } = readResendConfiguration(environment);
	return new ResendEmailService({ client: new Resend(apiKey), from });
}
