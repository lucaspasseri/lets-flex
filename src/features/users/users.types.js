/**
 * SQL raw data of a user.
 *
 * @typedef {object} UserRow
 * @property {number} id
 * @property {string} name
 * @property {string | Date | null} date_of_birth
 * @property {string | null} anamnesis
 */

/**
 * Application representation of a user.
 *
 * @typedef {object} User
 * @property {number} id
 * @property {string} name
 * @property {string | null} dateOfBirth
 * @property {string | null} anamnesis
 */

/**
 * Values required to create a user.
 *
 * @typedef {object} CreateUserInput
 * @property {string} name
 * @property {string | null} dateOfBirth
 * @property {string | null} anamnesis
 */

/**
 * Values required to find a user.
 *
 * @typedef {object} FindUserInput
 * @property {number | null} userId
 */

export {};
