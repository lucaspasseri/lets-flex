import { MAX_MEDIA_UPLOAD_BYTES } from "../../features/media/mediaUpload.js";

const MAX_MULTIPART_BYTES = MAX_MEDIA_UPLOAD_BYTES + 64 * 1024;

/**
 * Small, bounded multipart parser for the single-file admin media forms. It deliberately exposes
 * only text fields and one buffered file; storage and content validation remain feature-owned.
 *
 * @returns {import("express").RequestHandler}
 */
export default function parseMultipartForm() {
	return (req, res, next) => {
		const contentType = String(req.headers["content-type"] ?? "");
		if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
			next();
			return;
		}
		const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
		const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2]?.trim();
		if (!boundary || boundary.length > 200) {
			res.status(400).send("Invalid multipart form.");
			return;
		}
		const declaredLength = Number(req.headers["content-length"]);
		if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_BYTES) {
			res.status(413).send("The uploaded form is too large.");
			return;
		}

		const chunks = [];
		let total = 0;
		let finished = false;
		const reject = (status, message) => {
			if (finished) return;
			finished = true;
			res.status(status).send(message);
			req.destroy();
		};
		req.on("data", (chunk) => {
			if (finished) return;
			const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
			total += buffer.length;
			if (total > MAX_MULTIPART_BYTES) {
				reject(413, "The uploaded form is too large.");
				return;
			}
			chunks.push(buffer);
		});
		req.on("error", (error) => {
			if (!finished) next(error);
		});
		req.on("end", () => {
			if (finished) return;
			try {
				const parsed = parseMultipartBody(Buffer.concat(chunks), boundary);
				// @ts-ignore -- feature-owned request body populated by this middleware.
				req.body = parsed.fields;
				// @ts-ignore -- feature-owned request file populated by this middleware.
				req.file = parsed.file;
				finished = true;
				next();
			} catch {
				reject(400, "Invalid multipart form.");
			}
		});
	};
}

/**
 * @param {Buffer} body
 * @param {string} boundary
 * @returns {{fields: Record<string, string>, file?: {fieldname: string, originalname: string, encoding: string, mimetype: string, size: number, buffer: Buffer}}}
 */
function parseMultipartBody(body, boundary) {
	const delimiter = Buffer.from(`--${boundary}`);
	if (!body.subarray(0, delimiter.length).equals(delimiter))
		throw new Error("Invalid boundary");
	const fields = {};
	let file;
	let cursor = delimiter.length;
	while (cursor < body.length) {
		if (body.subarray(cursor, cursor + 2).equals(Buffer.from("--"))) break;
		if (!body.subarray(cursor, cursor + 2).equals(Buffer.from("\r\n"))) {
			throw new Error("Invalid part separator");
		}
		cursor += 2;
		const nextBoundary = body.indexOf(delimiter, cursor);
		if (nextBoundary === -1) throw new Error("Missing closing boundary");
		const part = body.subarray(cursor, nextBoundary - 2);
		const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
		if (headerEnd === -1) throw new Error("Invalid part headers");
		const headers = parsePartHeaders(part.subarray(0, headerEnd).toString("latin1"));
		const content = part.subarray(headerEnd + 4);
		const disposition = headers["content-disposition"];
		const name = disposition?.match(/(?:^|;)\s*name="([^"]+)"/i)?.[1];
		if (!name || name.length > 100) throw new Error("Invalid field name");
		const filename = disposition?.match(/(?:^|;)\s*filename="([^"]*)"/i)?.[1];
		if (filename !== undefined) {
			if (file) throw new Error("Only one file is supported");
			file = {
				fieldname: name,
				originalname: filename,
				encoding: "7bit",
				mimetype: headers["content-type"] ?? "",
				size: content.length,
				buffer: content,
			};
		} else {
			fields[name] = content.toString("utf8");
		}
		cursor = nextBoundary + delimiter.length;
	}
	return { fields, file };
}

/** @param {string} raw @returns {Record<string, string>} */
function parsePartHeaders(raw) {
	return Object.fromEntries(
		raw.split("\r\n").map((line) => {
			const separator = line.indexOf(":");
			if (separator < 1) throw new Error("Invalid part header");
			return [
				line.slice(0, separator).trim().toLowerCase(),
				line.slice(separator + 1).trim(),
			];
		}),
	);
}
