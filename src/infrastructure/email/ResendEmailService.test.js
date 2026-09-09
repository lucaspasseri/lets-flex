import assert from "node:assert/strict";
import test from "node:test";
import ResendEmailService, {
	EmailDeliveryError,
	readResendConfiguration,
} from "./ResendEmailService.js";

const message = {
	to: "member@example.com",
	resetUrl: "https://paxeri.dev/auth/password-reset?token=secret-token",
	expiresInMs: 30 * 60 * 1000,
};

test("Resend configuration requires an API key and valid sender", () => {
	assert.throws(() => readResendConfiguration({}), /RESEND_API_KEY is required/);
	assert.throws(
		() => readResendConfiguration({ RESEND_API_KEY: "test-key" }),
		/AUTH_EMAIL_FROM is required/,
	);
	assert.throws(
		() =>
			readResendConfiguration({
				RESEND_API_KEY: "test-key",
				AUTH_EMAIL_FROM: "not-an-address",
			}),
		/valid email address/,
	);
	assert.deepEqual(
		readResendConfiguration({
			RESEND_API_KEY: " test-key ",
			AUTH_EMAIL_FROM: " Let’s Flex account@auth.paxeri.dev ",
		}),
		{ apiKey: "test-key", from: "Let’s Flex account@auth.paxeri.dev" },
	);
});

test("password reset delivery maps safe transactional content without tracking or reply-to", async () => {
	let payload;
	const service = new ResendEmailService({
		from: "Let’s Flex account@auth.paxeri.dev",
		client: {
			emails: {
				async send(value) {
					payload = value;
					return { data: { id: "email_123" }, error: null };
				},
			},
		},
	});

	await service.sendPasswordReset(message);
	assert.equal(payload.from, "Let’s Flex account@auth.paxeri.dev");
	assert.equal(payload.to, message.to);
	assert.match(payload.text, /30 minutes/);
	assert.match(payload.text, /ignore this email/);
	assert.match(payload.text, /secret-token/);
	assert.match(payload.html, /Reset password/);
	assert.equal("replyTo" in payload, false);
	assert.equal("headers" in payload, false);
});

test("provider rejection becomes a secret-free application error", async () => {
	const service = new ResendEmailService({
		from: "Let’s Flex account@auth.paxeri.dev",
		client: {
			emails: {
				async send() {
					return {
						data: null,
						error: {
							message: `Rejected ${message.to} ${message.resetUrl}`,
							requestId: "request_123",
						},
					};
				},
			},
		},
	});

	await assert.rejects(service.sendPasswordReset(message), (error) => {
		assert.ok(error instanceof EmailDeliveryError);
		assert.equal(error.category, "provider_rejected");
		assert.equal(error.providerRequestId, "request_123");
		assert.doesNotMatch(error.message, /member|secret-token/);
		return true;
	});
});

test("transport failures become secret-free application errors", async () => {
	const service = new ResendEmailService({
		from: "Let’s Flex account@auth.paxeri.dev",
		client: {
			emails: {
				async send() {
					throw new Error(`Network failure for ${message.resetUrl}`);
				},
			},
		},
	});

	await assert.rejects(service.sendPasswordReset(message), (error) => {
		assert.ok(error instanceof EmailDeliveryError);
		assert.equal(error.category, "transport_failure");
		assert.doesNotMatch(error.message, /secret-token/);
		return true;
	});
});
