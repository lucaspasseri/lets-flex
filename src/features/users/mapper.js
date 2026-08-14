import { format } from "date-fns";

/**
 * @typedef {import("./users.types.js").UserRow} UserRow
 */

/**
 * @param {UserRow} row
 * @returns
 */

export function toLoggedUser(row) {
	return {
		id: row.id,
		name: row.name,
		dob:
			row?.date_of_birth instanceof Date
				? format(row.date_of_birth, "dd/MM/yyyy")
				: null,
		anamnesis: row.anamnesis,
	};
}
