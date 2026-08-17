/**
 * SQL raw data of a Muscle.
 *
 * @typedef {object} MuscleRow
 * @property {number} id
 * @property {string} common_name
 * @property {string} scientific_name
 * @property {string} body_region
 * @property {string} reference_url
 */

/**
 * Mapper of a Muscle.
 *
 * @typedef {object} MuscleMapper
 * @property {MuscleRow["id"]} id
 * @property {string} commonName
 * @property {string} scientificName
 * @property {string} bodyPart
 * @property {string} referenceUrl
 */
