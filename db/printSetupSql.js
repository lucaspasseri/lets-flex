import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { schemaSql } from "./schema.js";
import { seedSql } from "./seed.js";

const sql = `${schemaSql.trim()}\n\n${seedSql.trim()}\n`;

const outputFile = fileURLToPath(new URL("./setup.sql", import.meta.url));

writeFileSync(outputFile, sql, "utf8");

console.log(`Database setup written to ${outputFile}`);
