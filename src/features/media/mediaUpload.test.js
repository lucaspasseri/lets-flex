import assert from "node:assert/strict";
import test from "node:test";

import {
	MAX_MEDIA_UPLOAD_BYTES,
	MediaUploadValidationError,
	inspectUploadedImage,
} from "./mediaUpload.js";

function pngFixture(width = 640, height = 480) {
	const buffer = Buffer.alloc(45);
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
	buffer.writeUInt32BE(13, 8);
	buffer.write("IHDR", 12, "ascii");
	buffer.writeUInt32BE(width, 16);
	buffer.writeUInt32BE(height, 20);
	buffer.write("IEND", 37, "ascii");
	return buffer;
}

function jpegFixture(width = 800, height = 600) {
	const buffer = Buffer.alloc(24);
	buffer.set([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08]);
	buffer.writeUInt16BE(height, 7);
	buffer.writeUInt16BE(width, 9);
	buffer.set([0xff, 0xd9], 22);
	return buffer;
}

function webpFixture(width = 320, height = 240) {
	const buffer = Buffer.alloc(30);
	buffer.write("RIFF", 0, "ascii");
	buffer.writeUInt32LE(22, 4);
	buffer.write("WEBP", 8, "ascii");
	buffer.write("VP8X", 12, "ascii");
	buffer.writeUInt32LE(10, 16);
	buffer[24] = (width - 1) & 0xff;
	buffer[25] = ((width - 1) >> 8) & 0xff;
	buffer[26] = (width - 1) >> 16;
	buffer[27] = (height - 1) & 0xff;
	buffer[28] = ((height - 1) >> 8) & 0xff;
	buffer[29] = (height - 1) >> 16;
	return buffer;
}

test("supported raster uploads are signature-checked and dimensions are preserved", () => {
	assert.deepEqual(
		inspectUploadedImage({
			buffer: pngFixture(),
			mimetype: "image/png",
			originalname: "lift.png",
		}),
		{
			buffer: pngFixture(),
			mimeType: "image/png",
			extension: "png",
			width: 640,
			height: 480,
		},
	);
	assert.equal(
		inspectUploadedImage({
			buffer: jpegFixture(),
			mimetype: "image/jpeg",
			originalname: "lift.jpg",
		}).width,
		800,
	);
	assert.equal(
		inspectUploadedImage({
			buffer: webpFixture(),
			mimetype: "image/webp",
			originalname: "lift.webp",
		}).height,
		240,
	);
});

test("unsupported types, mismatched content, unsafe names, and oversized files fail safely", () => {
	assert.throws(
		() =>
			inspectUploadedImage({
				buffer: pngFixture(),
				mimetype: "image/svg+xml",
				originalname: "lift.svg",
			}),
		(error) =>
			error instanceof MediaUploadValidationError && error.code === "unsupported_type",
	);
	assert.throws(
		() =>
			inspectUploadedImage({
				buffer: pngFixture(),
				mimetype: "image/jpeg",
				originalname: "lift.jpg",
			}),
		(error) =>
			error instanceof MediaUploadValidationError && error.code === "invalid_image",
	);
	assert.throws(
		() =>
			inspectUploadedImage({
				buffer: pngFixture(),
				mimetype: "image/png",
				originalname: "../lift.png",
			}),
		(error) =>
			error instanceof MediaUploadValidationError && error.code === "invalid_filename",
	);
	assert.throws(
		() =>
			inspectUploadedImage({
				buffer: Buffer.alloc(MAX_MEDIA_UPLOAD_BYTES + 1),
				mimetype: "image/png",
				originalname: "lift.png",
			}),
		(error) =>
			error instanceof MediaUploadValidationError && error.code === "file_too_large",
	);
});
