import { z } from "zod";
import { positiveId } from "./idSchemas.js";

const optionalPositiveId = (message) =>
	z.preprocess(
		(value) => (value === "" || value == null ? undefined : value),
		positiveId(message).optional(),
	);

export const libraryPageQuerySchema = z.object({
	sessionId: optionalPositiveId("Choose a valid session template."),
	createSessionForDay: optionalPositiveId("Choose a valid training day."),
});
