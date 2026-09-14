/* global console */

import process from "node:process";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

const {
	R2_BUCKET_NAME,
	R2_ENDPOINT,
	R2_REGION = "auto",
	R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY,
} = process.env;

if (!R2_BUCKET_NAME || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
	throw new Error("Missing R2 environment variables");
}

const client = new S3Client({
	region: R2_REGION,
	endpoint: R2_ENDPOINT,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY,
	},
});

const key = `_smoke-tests/${Date.now()}.txt`;
const expected = "Let's Flex R2 smoke test";

await client.send(
	new PutObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: key,
		Body: expected,
		ContentType: "text/plain",
	}),
);

const object = await client.send(
	new GetObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: key,
	}),
);

const actual = await object.Body.transformToString();

if (actual !== expected) {
	throw new Error("R2 returned unexpected content");
}

await client.send(
	new DeleteObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: key,
	}),
);

console.log("R2 smoke test passed.");
