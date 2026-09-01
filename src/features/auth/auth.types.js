/**
 * A persisted sign-in identity attached to an application user.
 * Provider subjects are provider-scoped stable identifiers. For Google this
 * will be the provider's `sub`, not an email address.
 * @typedef {object} AuthIdentityRow
 * @property {number} id
 * @property {number} user_id
 * @property {string} provider
 * @property {string} provider_subject
 * @property {string | null} [password_hash]
 * @property {Date | string} created_at
 * @property {Date | string} updated_at
 */

export {};
