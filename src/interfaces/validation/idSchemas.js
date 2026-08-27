import { z } from "zod";

/** @param {string} message */
export const positiveId = (message) =>
	z.coerce.number({ error: message }).int(message).positive(message);
