/**
 * SQL raw data of a user.
 *
 * @typedef {object} UserRow
 * @property {number} id
 * @property {string | null} [email]
 * @property {"user" | "admin" | "guest"} [role]
 * @property {string} name
 * @property {string | Date | null} date_of_birth
 * @property {string | null} anamnesis
 * @property {boolean} [is_active]
 * @property {Date | string | null} [guest_expires_at]
 */

/**
 * Application representation of a user.
 *
 * @typedef {object} User
 * @property {number} id
 * @property {string | null} [email]
 * @property {"user" | "admin" | "guest"} [role]
 * @property {string} name
 * @property {string | null} dateOfBirth
 * @property {string | null} anamnesis
 * @property {boolean} [isActive]
 * @property {Date | string | null} [guestExpiresAt]
 */

/**
 * Values required to find a user.
 *
 * @typedef {object} FindUserInput
 * @property {User["id"] | null} userId
 */

export {};
