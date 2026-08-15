import { format } from "date-fns";

/**
 * @typedef {import("./users.types.js").UserRow} UserRow
 * @typedef {import("./users.types.js").User} User
 */

/**
 * @param {UserRow} row
 * @returns {User}
 */

export function toLoggedUser(row) {
	return {
		id: row.id,
		name: row.name,
		dateOfBirth:
			row?.date_of_birth instanceof Date
				? format(row.date_of_birth, "dd/MM/yyyy")
				: null,
		anamnesis: row.anamnesis,
	};
}
