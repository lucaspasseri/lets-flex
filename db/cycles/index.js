import pool from "../pool.js";

async function getAllCycles() {
	const { rows: cycles } = await pool.query("SELECT * FROM cycles");

	return cycles;
}

async function postNewCycle(name, programId, cycleOrder) {
	await pool.query(
		"INSERT INTO cycles (name, program_id, cycle_order) VALUES ($1, $2, $3)",
		[name, programId, cycleOrder],
	);
}

export { getAllCycles, postNewCycle };
