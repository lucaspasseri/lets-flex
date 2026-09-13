import assert from "node:assert/strict";
import test from "node:test";
import { Readable } from "node:stream";

import parseMultipartForm from "./parseMultipartForm.js";

function multipartBody(boundary) {
	return Buffer.from(
		[
			`--${boundary}`,
			'Content-Disposition: form-data; name="_csrf"',
			"",
			"csrf-value",
			`--${boundary}`,
			'Content-Disposition: form-data; name="entityType"',
			"",
			"exercise",
			`--${boundary}`,
			'Content-Disposition: form-data; name="media"; filename="bench.png"',
			"Content-Type: image/png",
			"",
			"png-bytes",
			`--${boundary}--`,
			"",
		].join("\r\n"),
	);
}

function responseStub() {
	return {
		statusCode: 200,
		message: null,
		status(code) {
			this.statusCode = code;
			return this;
		},
		send(message) {
			this.message = message;
			return this;
		},
	};
}

test("multipart parser exposes bounded text fields and one buffered file before CSRF validation", async () => {
	const boundary = "media-boundary";
	const body = multipartBody(boundary);
	const req = /** @type {any} */ (
		Object.assign(Readable.from([body]), {
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary}`,
				"content-length": String(body.length),
			},
		})
	);
	const res = responseStub();
	let nextCalled = false;

	/** @type {Promise<void>} */
	const parsed = new Promise((resolve, reject) => {
		parseMultipartForm()(req, /** @type {any} */ (res), (error) => {
			if (error) reject(error);
			nextCalled = true;
			resolve();
		});
	});
	await parsed;

	assert.equal(nextCalled, true);
	assert.equal(req.body._csrf, "csrf-value");
	assert.equal(req.body.entityType, "exercise");
	assert.equal(req.file.originalname, "bench.png");
	assert.equal(req.file.mimetype, "image/png");
	assert.equal(req.file.buffer.toString(), "png-bytes");
});

test("non-multipart requests pass through untouched", () => {
	const req = /** @type {any} */ ({
		headers: { "content-type": "application/x-www-form-urlencoded" },
	});
	let called = false;
	parseMultipartForm()(req, /** @type {any} */ ({}), () => {
		called = true;
	});
	assert.equal(called, true);
	assert.equal(req.body, undefined);
});
