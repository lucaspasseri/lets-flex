import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import session from "express-session";
import FakeEmailService from "../../src/infrastructure/email/FakeEmailService.js";

process.env.SESSION_SECRET ??= "i18n-application-test-secret";

const passport = {
	initialize() {
		return (_req, _res, next) => next();
	},
	session() {
		return (_req, _res, next) => next();
	},
};

let server;
let origin;

before(async () => {
	const { createApp } = await import("../../app.js");
	server = createApp({
		passport,
		emailService: new FakeEmailService(),
		sessionStore: new session.MemoryStore(),
	}).listen(0, "127.0.0.1");
	await new Promise((resolve, reject) => {
		server.once("listening", resolve);
		server.once("error", reject);
	});
	const address = /** @type {import("net").AddressInfo} */ (server.address());
	origin = `http://127.0.0.1:${address.port}`;
});

after(async () => {
	if (!server) return;
	await new Promise((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve(undefined))),
	);
});

function csrfFrom(html) {
	const match = html.match(/name="_csrf" value="([^"]+)"/);
	assert.ok(match);
	return match[1];
}

test("locale selection persists across requests and overrides Accept-Language", async () => {
	let cookie = "";
	const request = async (path, options = {}) => {
		const headers = new Headers(options.headers);
		if (cookie) headers.set("cookie", cookie);
		const response = await fetch(origin + path, {
			...options,
			headers,
			redirect: "manual",
		});
		const setCookie = response.headers.get("set-cookie");
		if (setCookie) cookie = setCookie.split(";", 1)[0];
		return { response, text: await response.text() };
	};

	const browserPortuguese = await request("/auth/login", {
		headers: { "accept-language": "pt-PT, en;q=0.8" },
	});
	assert.equal(browserPortuguese.response.status, 200);
	assert.match(browserPortuguese.text, /<html lang="pt-BR">/);
	assert.equal(browserPortuguese.response.headers.get("content-language"), "pt-BR");

	const switched = await request("/locale", {
		method: "POST",
		headers: {
			"accept-language": "pt-PT, en;q=0.8",
			"content-type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			_csrf: csrfFrom(browserPortuguese.text),
			locale: "en",
			returnTo: "/auth/login",
		}),
	});
	assert.equal(switched.response.status, 302);
	assert.equal(switched.response.headers.get("location"), "/auth/login");

	const persistedEnglish = await request("/auth/login", {
		headers: { "accept-language": "pt-BR,pt;q=0.9" },
	});
	assert.match(persistedEnglish.text, /<html lang="en">/);
	assert.equal(persistedEnglish.response.headers.get("content-language"), "en");
});
