import { portugueseCatalogTranslationSeedSql } from "../src/features/exerciseCatalog/catalogTranslations.js";

export const catalogTranslationSchemaSql = `
CREATE TABLE IF NOT EXISTS exercise_translations (
	exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,

	PRIMARY KEY (exercise_id, locale),
	CONSTRAINT exercise_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT exercise_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);

CREATE TABLE IF NOT EXISTS exercise_variant_translations (
	exercise_variant_id INTEGER NOT NULL REFERENCES exercise_variants(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,
	setup_description TEXT,

	PRIMARY KEY (exercise_variant_id, locale),
	CONSTRAINT exercise_variant_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT exercise_variant_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);

CREATE TABLE IF NOT EXISTS muscle_translations (
	muscle_id INTEGER NOT NULL REFERENCES muscles(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,

	PRIMARY KEY (muscle_id, locale),
	CONSTRAINT muscle_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT muscle_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);

CREATE TABLE IF NOT EXISTS equipment_translations (
	equipment_id INTEGER NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,

	PRIMARY KEY (equipment_id, locale),
	CONSTRAINT equipment_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT equipment_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);

CREATE TABLE IF NOT EXISTS movement_pattern_translations (
	movement_pattern_id INTEGER NOT NULL REFERENCES movement_patterns(id) ON DELETE CASCADE,
	locale VARCHAR(10) NOT NULL,
	name VARCHAR NOT NULL,
	notes TEXT,

	PRIMARY KEY (movement_pattern_id, locale),
	CONSTRAINT movement_pattern_translations_locale_supported
		CHECK (locale IN ('en', 'pt-BR')),
	CONSTRAINT movement_pattern_translations_name_trimmed
		CHECK (name = BTRIM(name) AND name <> '')
);
`;

export const catalogTranslationEnglishSeedSql = `
INSERT INTO exercise_translations (exercise_id, locale, name)
SELECT id, 'en', name
FROM exercises
ON CONFLICT (exercise_id, locale) DO NOTHING;

INSERT INTO exercise_variant_translations (
	exercise_variant_id,
	locale,
	name,
	setup_description
)
SELECT id, 'en', name, setup_description
FROM exercise_variants
WHERE owner_user_id IS NULL
ON CONFLICT (exercise_variant_id, locale) DO NOTHING;

INSERT INTO muscle_translations (muscle_id, locale, name)
SELECT id, 'en', common_name
FROM muscles
ON CONFLICT (muscle_id, locale) DO NOTHING;

INSERT INTO equipment_translations (equipment_id, locale, name)
SELECT id, 'en', name
FROM equipments
ON CONFLICT (equipment_id, locale) DO NOTHING;

INSERT INTO movement_pattern_translations (movement_pattern_id, locale, name, notes)
SELECT id, 'en', name, notes
FROM movement_patterns
ON CONFLICT (movement_pattern_id, locale) DO NOTHING;
`;

export const catalogTranslationSeedSql = `${catalogTranslationEnglishSeedSql}
${portugueseCatalogTranslationSeedSql}
`;

export { portugueseCatalogTranslationSeedSql as catalogTranslationPortugueseSeedSql };

export const catalogTranslationMigrationSql = `
${catalogTranslationSchemaSql}
${catalogTranslationEnglishSeedSql}
`;
