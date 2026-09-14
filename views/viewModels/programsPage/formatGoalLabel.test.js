import test from "node:test";
import assert from "node:assert/strict";
import formatGoalLabel from "./formatGoalLabel.js";
import { i18n } from "../../../src/infrastructure/i18n/i18n.js";

test("formats persisted goal identifiers as title-cased display words", () => {
	assert.equal(formatGoalLabel("hypertrophy"), "Hypertrophy");
	assert.equal(formatGoalLabel("weight_loss"), "Weight Loss");
	assert.equal(formatGoalLabel("general_fitness"), "General Fitness");
	assert.equal(formatGoalLabel("  MUSCLE__GAIN  "), "Muscle Gain");
});

test("returns an empty label for empty and non-string input", () => {
	for (const value of ["", "___", null, undefined, 7, {}]) {
		assert.equal(formatGoalLabel(value), "");
	}
});

test("localizes fixed goal labels without changing their canonical values", () => {
	const translatePt = i18n.getFixedT("pt-BR");
	const translateEn = i18n.getFixedT("en");

	assert.equal(formatGoalLabel("hypertrophy", translatePt), "Hipertrofia");
	assert.equal(formatGoalLabel("strength", translatePt), "Força");
	assert.equal(formatGoalLabel("weight_loss", translatePt), "Perda de peso");
	assert.equal(
		formatGoalLabel("general_fitness", translatePt),
		"Condicionamento geral",
	);
	assert.equal(formatGoalLabel("strength", translateEn), "Strength");
});
