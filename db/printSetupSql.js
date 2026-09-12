import { schemaSql } from "./schema.js";
import { seedSql } from "./seed.js";

process.stdout.write(`${schemaSql.trim()}\n\n${seedSql.trim()}\n`);
