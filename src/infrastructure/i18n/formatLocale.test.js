import assert from "node:assert/strict";
import test from "node:test";
import {
	formatLocaleDate,
	formatLocaleDuration,
	formatLocaleMeasurement,
	formatLocaleNumber,
	formatLocalePercent,
} from "./formatLocale.js";

test("formats dates according to the active locale without shifting date-only values", () => {
	assert.equal(
		formatLocaleDate("2026-09-11", "en", { dateStyle: "long" }),
		"September 11, 2026",
	);
	assert.equal(
		formatLocaleDate("2026-09-11", "pt-BR", { dateStyle: "long" }),
		"11 de setembro de 2026",
	);
});

test("formats numbers and percentages according to the active locale", () => {
	assert.equal(formatLocaleNumber(1234.5, "en"), "1,234.5");
	assert.equal(formatLocaleNumber(1234.5, "pt-BR"), "1.234,5");
	assert.equal(formatLocalePercent(60, "en"), "60%");
	assert.equal(formatLocalePercent(60, "pt-BR"), "60%");
});

test("formats durations and measurements with localized unit names", () => {
	assert.equal(formatLocaleDuration(1, "minute", "en"), "1 minute");
	assert.equal(formatLocaleDuration(2, "minute", "pt-BR"), "2 minutos");
	assert.equal(formatLocaleMeasurement(102.5, "Kilograms", "en"), "102.5 kilograms");
	assert.equal(
		formatLocaleMeasurement(102.5, "Kilograms", "pt-BR"),
		"102,5 quilogramas",
	);
});
