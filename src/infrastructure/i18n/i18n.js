import path from "node:path";
import { fileURLToPath } from "node:url";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import * as middleware from "i18next-http-middleware";

export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = Object.freeze(["en", "pt-BR"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localePath = path.resolve(__dirname, "../../../locales/{{lng}}/{{ns}}.json");

/**
 * Converts common browser Portuguese and English variants to the application
 * locale contract. Unsupported values remain available for i18next to reject
 * and fall back safely.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeDetectedLocale(value) {
	if (typeof value !== "string") return "";

	const locale = value.trim().replaceAll("_", "-");
	if (/^pt(?:-|$)/i.test(locale)) return "pt-BR";
	if (/^en(?:-|$)/i.test(locale)) return DEFAULT_LOCALE;
	return locale;
}

/**
 * @param {unknown} value
 * @returns {value is "en" | "pt-BR"}
 */
export function isSupportedLocale(value) {
	return SUPPORTED_LOCALES.includes(/** @type {"en" | "pt-BR"} */ (value));
}

export const i18n = i18next
	.createInstance()
	.use(Backend)
	.use(middleware.LanguageDetector);

i18n.init({
	initAsync: false,
	fallbackLng: DEFAULT_LOCALE,
	supportedLngs: SUPPORTED_LOCALES,
	nonExplicitSupportedLngs: false,
	load: "currentOnly",
	preload: SUPPORTED_LOCALES,
	ns: ["common"],
	defaultNS: "common",
	backend: { loadPath: localePath },
	detection: {
		order: ["session", "header"],
		lookupSession: "locale",
		caches: false,
		convertDetectedLanguage: normalizeDetectedLocale,
	},
	interpolation: { escapeValue: false },
	returnNull: false,
});

export const i18nMiddleware = middleware.handle(
	i18n,
	// @ts-expect-error -- attachLocals is supported at runtime but omitted from the package type.
	{ attachLocals: true },
);
