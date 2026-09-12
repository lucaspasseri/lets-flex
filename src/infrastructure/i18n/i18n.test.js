import assert from "node:assert/strict";
import test from "node:test";
import {
	DEFAULT_LOCALE,
	i18n,
	i18nMiddleware,
	normalizeDetectedLocale,
} from "./i18n.js";

function runMiddleware({ session = {}, acceptLanguage = "" } = {}) {
	const request = /** @type {any} */ ({
		path: "/",
		url: "/",
		originalUrl: "/",
		headers: { "accept-language": acceptLanguage },
		session,
	});
	const response = /** @type {any} */ ({
		locals: {},
		_headers: {},
		getHeader(name) {
			return this._headers[name];
		},
		setHeader(name, value) {
			this._headers[name] = value;
		},
	});

	return new Promise((resolve, reject) => {
		i18nMiddleware(request, response, (error) => {
			if (error) reject(error);
			else resolve({ request, response });
		});
	});
}

test("normalizes supported English and Portuguese browser variants", () => {
	assert.equal(normalizeDetectedLocale("pt"), "pt-BR");
	assert.equal(normalizeDetectedLocale("pt-PT"), "pt-BR");
	assert.equal(normalizeDetectedLocale("pt_BR"), "pt-BR");
	assert.equal(normalizeDetectedLocale("en-US"), DEFAULT_LOCALE);
	assert.equal(normalizeDetectedLocale("fr-FR"), "fr-FR");
});

test("resolves the session locale before the browser header", async () => {
	const { request, response } = await runMiddleware({
		session: { locale: "en" },
		acceptLanguage: "pt-BR,pt;q=0.9",
	});

	assert.equal(request.language, "en");
	assert.equal(response.locals.language, "en");
	assert.equal(request.t("navigation.library"), "Library");
});

test("normalizes a Portuguese browser request and exposes EJS translation locals", async () => {
	const { request, response } = await runMiddleware({
		acceptLanguage: "pt-PT, en;q=0.8",
	});

	assert.equal(request.language, "pt-BR");
	assert.equal(response.locals.language, "pt-BR");
	assert.equal(response.locals.t("navigation.library"), "Biblioteca");
	assert.equal(response._headers["Content-Language"], "pt-BR");
});

test("unsupported browser languages fall back to English without persisting them", async () => {
	const session = {};
	const { request } = await runMiddleware({
		session,
		acceptLanguage: "fr-FR, de;q=0.8",
	});

	assert.equal(request.language, "en");
	assert.equal(session.locale, undefined);
});

test("missing translations use the supplied safe fallback", () => {
	const translate = i18n.getFixedT("pt-BR");
	assert.equal(
		translate("missing.production.key", { defaultValue: "Safe fallback" }),
		"Safe fallback",
	);
});
