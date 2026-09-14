export const mediaSchemaSql = `
CREATE TABLE IF NOT EXISTS media_assets (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	storage_key TEXT NOT NULL,
	mime_type VARCHAR(100) NOT NULL,
	width INTEGER NOT NULL,
	height INTEGER NOT NULL,
	source VARCHAR(50) NOT NULL,
	alt_text TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	CONSTRAINT media_assets_storage_key_present
		CHECK (BTRIM(storage_key) <> ''),
	CONSTRAINT media_assets_mime_type_present
		CHECK (BTRIM(mime_type) <> ''),
	CONSTRAINT media_assets_dimensions_positive
		CHECK (width > 0 AND height > 0),
	CONSTRAINT media_assets_source_present
		CHECK (BTRIM(source) <> ''),
	CONSTRAINT media_assets_alt_text_trimmed
		CHECK (alt_text IS NULL OR alt_text = BTRIM(alt_text)),
	UNIQUE (storage_key)
);

CREATE TABLE IF NOT EXISTS media_asset_alt_texts (
	media_asset_id INTEGER NOT NULL
		REFERENCES media_assets(id)
		ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	alt_text TEXT NOT NULL,

	PRIMARY KEY (media_asset_id, locale),
	CONSTRAINT media_asset_alt_texts_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT media_asset_alt_texts_value_trimmed
		CHECK (alt_text = BTRIM(alt_text) AND alt_text <> '')
);

CREATE INDEX IF NOT EXISTS media_asset_alt_texts_locale_idx
	ON media_asset_alt_texts (locale, media_asset_id);

CREATE TABLE IF NOT EXISTS entity_media (
	id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	media_asset_id INTEGER NOT NULL
		REFERENCES media_assets(id)
		ON DELETE RESTRICT,
	entity_type VARCHAR(40) NOT NULL,
	entity_id INTEGER NOT NULL,
	role VARCHAR(20) NOT NULL DEFAULT 'primary',
	sort_order INTEGER NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	CONSTRAINT entity_media_entity_type_supported
		CHECK (entity_type IN ('exercise', 'exercise_variant', 'muscle', 'equipment', 'movement_pattern')),
	CONSTRAINT entity_media_entity_id_positive
		CHECK (entity_id > 0),
	CONSTRAINT entity_media_role_supported
		CHECK (role = 'primary'),
	CONSTRAINT entity_media_sort_order_valid
		CHECK (sort_order >= 0),
	UNIQUE (entity_type, entity_id, role)
);

CREATE INDEX IF NOT EXISTS entity_media_lookup_idx
	ON entity_media (entity_type, entity_id, role, sort_order, id);
`;
