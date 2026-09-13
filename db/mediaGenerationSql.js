export const mediaGenerationSchemaSql = `
CREATE TABLE IF NOT EXISTS media_generation_candidates (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	entity_type VARCHAR(40) NOT NULL,
	entity_id INTEGER NOT NULL,
	requested_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
	provider VARCHAR(80) NOT NULL,
	provider_model VARCHAR(120),
	preset VARCHAR(80) NOT NULL,
	prompt_version VARCHAR(40) NOT NULL,
	source VARCHAR(50) NOT NULL DEFAULT 'ai-generation',
	storage_key TEXT NOT NULL UNIQUE,
	mime_type VARCHAR(100) NOT NULL,
	width INTEGER NOT NULL,
	height INTEGER NOT NULL,
	reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
	reviewed_at TIMESTAMPTZ,
	approved_media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE RESTRICT,
	private_file_removed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	CONSTRAINT media_generation_candidate_entity_type_supported
		CHECK (entity_type IN ('exercise', 'exercise_variant', 'equipment', 'movement_pattern')),
	CONSTRAINT media_generation_candidate_entity_id_positive CHECK (entity_id > 0),
	CONSTRAINT media_generation_candidate_status_valid
		CHECK (status IN ('pending_review', 'approved', 'rejected')),
	CONSTRAINT media_generation_candidate_source_valid CHECK (source = 'ai-generation'),
	CONSTRAINT media_generation_candidate_storage_key_present CHECK (BTRIM(storage_key) <> ''),
	CONSTRAINT media_generation_candidate_mime_type_present CHECK (BTRIM(mime_type) <> ''),
	CONSTRAINT media_generation_candidate_dimensions_positive CHECK (width > 0 AND height > 0),
	CONSTRAINT media_generation_candidate_review_state_valid CHECK (
		(status = 'pending_review' AND reviewed_at IS NULL AND reviewed_by_user_id IS NULL AND approved_media_asset_id IS NULL)
		OR (status = 'rejected' AND reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL AND approved_media_asset_id IS NULL)
		OR (status = 'approved' AND reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL AND approved_media_asset_id IS NOT NULL)
	)
);

CREATE INDEX IF NOT EXISTS media_generation_candidates_target_idx
	ON media_generation_candidates (entity_type, entity_id, status, created_at DESC);
`;
