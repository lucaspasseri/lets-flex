import assert from "node:assert/strict";
import test from "node:test";

import { schemaSql } from "./schema.js";
import {
	catalogTranslationPortugueseSeedSql,
	catalogTranslationMigrationSql,
	catalogTranslationSchemaSql,
	catalogTranslationSeedSql,
} from "./catalogTranslationsSql.js";
import { loadMigrations, validateMigrationTarget } from "./migrate.js";
import {
	createPortugueseCatalogTranslationSeedSql,
	portugueseCatalogTranslations,
	validatePortugueseCatalogTranslations,
} from "../src/features/exerciseCatalog/catalogTranslations.js";

test("catalog translation schema uses explicit stable foreign-key tables", () => {
	for (const table of [
		"exercise_translations",
		"exercise_variant_translations",
		"muscle_translations",
		"equipment_translations",
		"movement_pattern_translations",
	]) {
		assert.match(
			catalogTranslationSchemaSql,
			new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`),
		);
		assert.match(catalogTranslationSchemaSql, new RegExp(`REFERENCES [a-z_]+\\(id\\)`));
		assert.match(catalogTranslationSchemaSql, /PRIMARY KEY \([^)]*locale\)/);
	}

	assert.match(catalogTranslationSchemaSql, /locale IN \('en', 'pt-BR'\)/);
	assert.match(catalogTranslationSchemaSql, /name = BTRIM\(name\) AND name <> ''/);
	assert.ok(schemaSql.includes(catalogTranslationSchemaSql.trim()));
	assert.doesNotMatch(catalogTranslationSchemaSql, /entity_type|entity_id/);
});

test("catalog translation seed backfills English only for global variants", () => {
	assert.match(catalogTranslationSeedSql, /FROM exercises/);
	assert.match(
		catalogTranslationSeedSql,
		/FROM exercise_variants\s+WHERE owner_user_id IS NULL/s,
	);
	assert.match(catalogTranslationSeedSql, /FROM muscles/);
	assert.match(catalogTranslationSeedSql, /FROM equipments/);
	assert.match(catalogTranslationSeedSql, /FROM movement_patterns/);
	assert.match(catalogTranslationMigrationSql, /ON CONFLICT \(exercise_id, locale\)/);
});

test("Brazilian Portuguese catalog translations are complete and global-only", () => {
	assert.equal(validatePortugueseCatalogTranslations(), true);
	assert.deepEqual(
		Object.fromEntries(
			Object.entries(portugueseCatalogTranslations).map(([type, values]) => [
				type,
				Object.keys(values).length,
			]),
		),
		{
			exercises: 78,
			exerciseVariants: 129,
			muscles: 24,
			equipment: 28,
			movementPatterns: 8,
		},
	);

	assert.match(catalogTranslationPortugueseSeedSql, /'pt-BR'/);
	assert.match(catalogTranslationPortugueseSeedSql, /owner_user_id IS NULL/);
	assert.doesNotMatch(catalogTranslationPortugueseSeedSql, /setup_description/);
	assert.match(
		createPortugueseCatalogTranslationSeedSql(),
		/\('Push Up', 'Flexão de braço'\)/,
	);
	assert.match(
		catalogTranslationPortugueseSeedSql,
		/\('World''s Greatest Stretch', 'Maior alongamento do mundo'\)/,
	);
});

test("migration loader exposes ordered catalog translation migration", async () => {
	const migrations = await loadMigrations();

	assert.deepEqual(
		migrations.map(({ name }) => name),
		["001_catalog_translations", "002_catalog_translations_pt_br"],
	);
	assert.match(migrations[0].sql, /CREATE TABLE IF NOT EXISTS exercise_translations/);
	assert.doesNotMatch(migrations[0].sql, /'Flexão de braço'/);
	assert.match(migrations[1].sql, /'pt-BR'/);
});

test("migration target requires explicit opt-in and rejects production", () => {
	assert.throws(
		() =>
			validateMigrationTarget({
				connectionString: "postgresql://localhost/lets_flex_dev",
				environment: { NODE_ENV: "development", ALLOW_DATABASE_MIGRATION: "false" },
			}),
		/ALLOW_DATABASE_MIGRATION=true/,
	);
	assert.throws(
		() =>
			validateMigrationTarget({
				connectionString: "postgresql://localhost/lets_flex_dev",
				environment: { NODE_ENV: "production", ALLOW_DATABASE_MIGRATION: "true" },
			}),
		/ALLOW_PRODUCTION_DATABASE_MIGRATION=true/,
	);
	assert.equal(
		validateMigrationTarget({
			connectionString: "postgresql://production.example.com/lets_flex",
			environment: {
				NODE_ENV: "production",
				ALLOW_DATABASE_MIGRATION: "true",
				ALLOW_PRODUCTION_DATABASE_MIGRATION: "true",
			},
		}),
		"postgresql://production.example.com/lets_flex",
	);
	assert.equal(
		validateMigrationTarget({
			connectionString: "postgresql://localhost/lets_flex_dev",
			environment: { NODE_ENV: "development", ALLOW_DATABASE_MIGRATION: "true" },
		}),
		"postgresql://localhost/lets_flex_dev",
	);
	assert.throws(
		() =>
			validateMigrationTarget({
				connectionString: "not-a-database-url",
				environment: {
					NODE_ENV: "production",
					ALLOW_DATABASE_MIGRATION: "true",
					ALLOW_PRODUCTION_DATABASE_MIGRATION: "true",
				},
			}),
		/valid PostgreSQL URL/,
	);
});
