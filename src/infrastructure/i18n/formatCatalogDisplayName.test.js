import assert from "node:assert/strict";
import test from "node:test";
import formatCatalogDisplayName from "./formatCatalogDisplayName.js";

test("formats a Portuguese catalog translation beside its canonical name", () => {
	assert.equal(
		formatCatalogDisplayName(
			"Bodyweight Box Squat",
			"Agachamento na caixa com peso corporal",
			"pt-BR",
		),
		"Bodyweight Box Squat (Agachamento na caixa com peso corporal)",
	);
});

test("keeps the canonical catalog name when Portuguese is missing or English is active", () => {
	assert.equal(formatCatalogDisplayName("Box Squat", null, "pt-BR"), "Box Squat");
	assert.equal(
		formatCatalogDisplayName("Bodyweight Push Up", "Flexão com peso corporal", "en"),
		"Bodyweight Push Up",
	);
});

test("does not duplicate effectively identical catalog labels", () => {
	assert.equal(
		formatCatalogDisplayName("Box Squat", " box   squat ", "pt-BR"),
		"Box Squat",
	);
});
