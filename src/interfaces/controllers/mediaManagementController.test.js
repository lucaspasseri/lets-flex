import assert from "node:assert/strict";
import test from "node:test";

import {
	createCanonicalPromotionDiagnostic,
	createMediaManagementPageFeedback,
	logCanonicalPromotionRejection,
	mediaGenerationErrorStatus,
} from "./mediaManagementController.js";
import { MediaGenerationError } from "../../features/media/mediaGeneration.js";

function translate(_key, options = {}) {
	return options.defaultValue ?? "";
}

test("canonical promotion diagnostics include safe request context without the request body", () => {
	const values = {
		entityType: "muscle",
		entityId: "13",
		mediaAssetId: "75",
		_csrf: "must-not-be-logged",
		cookie: "must-not-be-logged",
		authorization: "must-not-be-logged",
	};
	const details = {
		rejectionReason: "alt_text_missing",
		errorName: "MediaCanonicalPromotionError",
		errorCode: "alt_text_missing",
		errorMessage:
			"Canonical media requires English and Brazilian Portuguese image descriptions.",
		httpStatus: 422,
	};
	const diagnostic = createCanonicalPromotionDiagnostic(
		/** @type {any} */ ({
			get(name) {
				return name === "Rndr-Id" ? "render-request-123" : undefined;
			},
		}),
		values,
		details,
	);

	assert.deepEqual(diagnostic, {
		requestId: "render-request-123",
		entityType: "muscle",
		entityId: "13",
		mediaAssetId: "75",
		rejectionReason: "alt_text_missing",
		errorName: "MediaCanonicalPromotionError",
		errorCode: "alt_text_missing",
		errorMessage:
			"Canonical media requires English and Brazilian Portuguese image descriptions.",
		httpStatus: 422,
	});
	assert.equal("_csrf" in diagnostic, false);
});

test("canonical promotion emits a searchable 422 diagnostic without sensitive request data", () => {
	const logged = [];
	const originalConsoleError = console.error;
	console.error = (...args) => logged.push(args);
	try {
		logCanonicalPromotionRejection(
			/** @type {any} */ ({
				get(name) {
					return name === "Rndr-Id" ? "render-request-123" : undefined;
				},
			}),
			{
				entityType: "muscle",
				entityId: 13,
				mediaAssetId: 75,
				_csrf: "must-not-be-logged",
				cookie: "must-not-be-logged",
				sessionId: "must-not-be-logged",
				authorization: "must-not-be-logged",
			},
			{
				name: "MediaCanonicalPromotionError",
				code: "alt_text_missing",
				message:
					"Canonical media requires English and Brazilian Portuguese image descriptions.",
			},
			422,
		);
	} finally {
		console.error = originalConsoleError;
	}

	assert.equal(logged.length, 1);
	assert.equal(logged[0][0], "[canonical-media] promotion failed");
	assert.deepEqual(logged[0][1], {
		requestId: "render-request-123",
		entityType: "muscle",
		entityId: 13,
		mediaAssetId: 75,
		rejectionReason: "alt_text_missing",
		errorName: "MediaCanonicalPromotionError",
		errorCode: "alt_text_missing",
		errorMessage:
			"Canonical media requires English and Brazilian Portuguese image descriptions.",
		httpStatus: 422,
	});
	assert.doesNotMatch(JSON.stringify(logged), /must-not-be-logged/);
});

test("media operation feedback uses explicit success semantics for upload, assignment, removal, and approval", () => {
	const cases = [
		["upload", "The image was uploaded and assigned to this entity."],
		["assign", "The existing media was assigned to this entity."],
		["remove", "The direct media assignment was removed."],
		["approve", "The generated image was approved and assigned to this entity."],
	];

	for (const [operation, message] of cases) {
		const feedback = createMediaManagementPageFeedback(translate, "success", operation);
		assert.deepEqual(
			{ tone: feedback.tone, eyebrow: feedback.eyebrow, message: feedback.message },
			{ tone: "success", eyebrow: "Success", message },
		);
	}
});

test("canonical feedback names the image and entity", () => {
	const feedback = createMediaManagementPageFeedback(
		translate,
		"success",
		"canonical",
		{
			entityName: "Bench Press",
			imageLabel: "“Bench press”",
		},
	);

	assert.equal(feedback.message, "“Bench press” is now canonical for Bench Press.");
});

test("media validation feedback uses explicit error semantics and never success copy", () => {
	const feedback = createMediaManagementPageFeedback(translate, "error");

	assert.deepEqual(
		{
			tone: feedback.tone,
			eyebrow: feedback.eyebrow,
			title: feedback.title,
			message: feedback.message,
		},
		{
			tone: "error",
			eyebrow: "Action not completed",
			title: "Media could not be updated",
			message: "Review the information and try again.",
		},
	);
	assert.doesNotMatch(feedback.message, /updated|assigned|removed/);
});

test("media generation errors distinguish invalid input from provider availability", () => {
	assert.equal(
		mediaGenerationErrorStatus(
			new MediaGenerationError("invalid_refinement", "Invalid refinement."),
		),
		422,
	);
	assert.equal(
		mediaGenerationErrorStatus(
			new MediaGenerationError("not_configured", "Not configured."),
		),
		503,
	);
	assert.equal(
		mediaGenerationErrorStatus(
			new MediaGenerationError("provider_rejected", "Rejected."),
		),
		502,
	);
});
