import { Pool, types } from "pg";

// types.setTypeParser(1082, value => value);

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.DATABASE_URL?.includes("neondb")
		? { rejectUnauthorized: false }
		: false,
});

export default pool;
