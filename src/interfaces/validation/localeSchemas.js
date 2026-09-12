import { z } from "zod";

export const localeSelectionSchema = z.object({
	locale: z.enum(["en", "pt-BR"]),
	returnTo: z.string().optional().default("/"),
});
