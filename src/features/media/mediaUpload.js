const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const MAX_MEDIA_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_MEDIA_DIMENSION = 10_000;
export const SUPPORTED_MEDIA_TYPES = Object.freeze({
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
});

export class MediaUploadValidationError extends Error {
	/** @param {string} code @param {string} message */
	constructor(code, message) {
		super(message);
		this.name = "MediaUploadValidationError";
		this.code = code;
	}
}

/**
 * Validate a multipart-upload-shaped object and inspect the bytes. The caller must not use the
 * client filename or MIME value as a storage path or as the only content check.
 *
 * @param {{buffer?: Buffer, mimetype?: unknown, originalname?: unknown, size?: unknown}} file
 * @returns {{buffer: Buffer, mimeType: keyof typeof SUPPORTED_MEDIA_TYPES, extension: string, width: number, height: number}}
 */
export function inspectUploadedImage(file) {
	if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
		throw new MediaUploadValidationError("missing_file", "Choose an image to upload.");
	}
	if (file.buffer.length > MAX_MEDIA_UPLOAD_BYTES) {
		throw new MediaUploadValidationError(
			"file_too_large",
			"Images must be 8 MB or smaller.",
		);
	}

	const mimeType = normalizeMimeType(file.mimetype);
	const extension = SUPPORTED_MEDIA_TYPES[mimeType];
	validateOriginalName(file.originalname, extension);
	const dimensions = inspectImageBytes(file.buffer, mimeType);

	return {
		buffer: file.buffer,
		mimeType,
		extension,
		...dimensions,
	};
}

/** @param {unknown} value @returns {keyof typeof SUPPORTED_MEDIA_TYPES} */
function normalizeMimeType(value) {
	const mimeType = typeof value === "string" ? value.trim().toLowerCase() : "";
	if (!Object.hasOwn(SUPPORTED_MEDIA_TYPES, mimeType)) {
		throw new MediaUploadValidationError(
			"unsupported_type",
			"Use a PNG, JPEG, or WebP image.",
		);
	}
	return /** @type {keyof typeof SUPPORTED_MEDIA_TYPES} */ (mimeType);
}

/** @param {unknown} value @param {string} expectedExtension */
function validateOriginalName(value, expectedExtension) {
	if (typeof value !== "string" || value.length === 0 || value.length > 255) {
		throw new MediaUploadValidationError(
			"invalid_filename",
			"The image filename is invalid.",
		);
	}
	if (
		value.includes("/") ||
		value.includes("\\") ||
		[...value].some((character) => {
			const code = character.charCodeAt(0);
			return code === 0 || (code >= 1 && code <= 31) || code === 127;
		})
	) {
		throw new MediaUploadValidationError(
			"invalid_filename",
			"The image filename is invalid.",
		);
	}
	const dotIndex = value.lastIndexOf(".");
	if (
		dotIndex !== -1 &&
		value.slice(dotIndex + 1).toLowerCase() !== expectedExtension
	) {
		throw new MediaUploadValidationError(
			"invalid_filename",
			"The image filename does not match its image type.",
		);
	}
}

/** @param {Buffer} buffer @param {keyof typeof SUPPORTED_MEDIA_TYPES} mimeType */
function inspectImageBytes(buffer, mimeType) {
	const dimensions =
		mimeType === "image/png"
			? inspectPng(buffer)
			: mimeType === "image/jpeg"
				? inspectJpeg(buffer)
				: inspectWebp(buffer);
	if (
		!dimensions ||
		!Number.isInteger(dimensions.width) ||
		!Number.isInteger(dimensions.height) ||
		dimensions.width <= 0 ||
		dimensions.height <= 0 ||
		dimensions.width > MAX_MEDIA_DIMENSION ||
		dimensions.height > MAX_MEDIA_DIMENSION
	) {
		throw new MediaUploadValidationError(
			"invalid_image",
			"The uploaded file is not a supported image.",
		);
	}
	return dimensions;
}

/** @param {Buffer} buffer @returns {{width: number, height: number} | null} */
function inspectPng(buffer) {
	if (
		buffer.length < 45 ||
		!buffer.subarray(0, 8).equals(PNG_SIGNATURE) ||
		!buffer.subarray(8, 12).equals(Buffer.from([0, 0, 0, 13])) ||
		!buffer.includes(Buffer.from("IEND"), 24)
	)
		return null;
	if (buffer.toString("ascii", 12, 16) !== "IHDR") return null;
	return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** @param {Buffer} buffer @returns {{width: number, height: number} | null} */
function inspectJpeg(buffer) {
	if (
		buffer.length < 6 ||
		buffer[0] !== 0xff ||
		buffer[1] !== 0xd8 ||
		buffer.lastIndexOf(Buffer.from([0xff, 0xd9])) === -1
	)
		return null;
	let offset = 2;
	while (offset + 3 < buffer.length) {
		if (buffer[offset] !== 0xff) return null;
		while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
		const marker = buffer[offset++];
		if (marker === 0xd9 || marker === 0xda) break;
		if (marker >= 0xd0 && marker <= 0xd7) continue;
		if (offset + 1 >= buffer.length) return null;
		const segmentLength = buffer.readUInt16BE(offset);
		if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
		if (isJpegSizeMarker(marker)) {
			if (segmentLength < 7) return null;
			return {
				height: buffer.readUInt16BE(offset + 3),
				width: buffer.readUInt16BE(offset + 5),
			};
		}
		offset += segmentLength;
	}
	return null;
}

/** @param {number} marker */
function isJpegSizeMarker(marker) {
	return (
		(marker >= 0xc0 && marker <= 0xc3) ||
		(marker >= 0xc5 && marker <= 0xc7) ||
		(marker >= 0xc9 && marker <= 0xcb) ||
		(marker >= 0xcd && marker <= 0xcf)
	);
}

/** @param {Buffer} buffer @returns {{width: number, height: number} | null} */
function inspectWebp(buffer) {
	if (
		buffer.length < 30 ||
		buffer.toString("ascii", 0, 4) !== "RIFF" ||
		buffer.toString("ascii", 8, 12) !== "WEBP"
	)
		return null;
	const chunkType = buffer.toString("ascii", 12, 16);
	if (
		chunkType !== "VP8X" ||
		buffer.readUInt32LE(16) < 10 ||
		buffer.readUInt32LE(4) + 8 > buffer.length
	)
		return null;
	return {
		width: 1 + readUInt24LE(buffer, 24),
		height: 1 + readUInt24LE(buffer, 27),
	};
}

/** @param {Buffer} buffer @param {number} offset @returns {number} */
function readUInt24LE(buffer, offset) {
	return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}
