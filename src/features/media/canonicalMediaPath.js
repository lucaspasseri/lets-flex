/**
 * The compatibility path is a stable public/manifest identity. It is separate from the
 * provider-neutral object key that points at the canonical bytes.
 *
 * @param {{entityType: string, entityKey: string, digest: string, extension: string}} input
 * @returns {string}
 */
export function createCanonicalMediaPath({ entityType, entityKey, digest, extension }) {
	return `/media/catalog/promoted/${entityType}-${entityKey}-${digest}.${extension}`;
}
