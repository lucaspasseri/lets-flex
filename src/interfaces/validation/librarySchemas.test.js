import assert from "node:assert/strict";
import test from "node:test";

import { libraryPageQuerySchema } from "./librarySchemas.js";

test("Library context query accepts only typed identities and strips redirect-like input", () => {
	assert.deepEqual(
		libraryPageQuerySchema.parse({
			sessionId: "4",
			createSessionForDay: "9",
			returnTo: "https://evil.example",
		}),
		{ sessionId: 4, createSessionForDay: 9 },
	);
	assert.equal(
		libraryPageQuerySchema.safeParse({ createSessionForDay: "//evil.example" }).success,
		false,
	);
});
