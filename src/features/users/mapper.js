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
		email: row.email ?? null,
		role: row.role ?? "user",
		name: row.name,
		isActive: row.is_active ?? true,
		guestExpiresAt: row.guest_expires_at ?? null,
		dateOfBirth:
			row?.date_of_birth instanceof Date
				? format(row.date_of_birth, "dd/MM/yyyy")
				: null,
		anamnesis: row.anamnesis,
	};
}
