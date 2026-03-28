import pool from "../pool.js";

async function getAllCycles() {
	const { rows: cycles } = await pool.query("SELECT * FROM cycles");

	return cycles;
}

async function getAllCyclesWithoutIds() {
	const { rows: cycles } = await pool.query(
		"SELECT programs.name AS program_name, cycles.name AS cycle_name, cycles.cycle_order AS cycle_order FROM cycles JOIN programs ON cycles.program_id = programs.id",
	);

	return cycles;
}

async function postNewCycle(name, programId, cycleOrder) {
	const { rows: existProgram } = await pool.query(
		"SELECT * FROM programs WHERE id = $1",
		[programId],
	);

	if (existProgram.length === 0) {
		throw new Error(`Program with ID ${programId} was not found`);
	}

	const { rows: howManyCycles } = await pool.query(
		"SELECT COUNT(*) FROM cycles WHERE program_id = $1",
		[programId],
	);

	const numberOfCycles = Number(howManyCycles[0].count);

	if (Number(cycleOrder) > numberOfCycles + 1) {
		throw new Error(`Cycle order must be at most ${numberOfCycles + 1}`);
	}

	if (Number(cycleOrder) === numberOfCycles + 1) {
		await pool.query(
			"INSERT INTO cycles (name, program_id, cycle_order) VALUES ($1, $2, $3)",
			[name, programId, Number(cycleOrder)],
		);
		return;
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		await client.query(
			"UPDATE cycles SET cycle_order = cycle_order + 1 WHERE program_id = $1 AND cycle_order >= $2",
			[programId, Number(cycleOrder)],
		);

		await client.query(
			"INSERT INTO cycles (name, program_id, cycle_order) VALUES ($1, $2, $3)",
			[name, programId, Number(cycleOrder)],
		);

		await client.query("COMMIT");
	} catch (err) {
		console.log({ err });
		await client.query("ROLLBACK");
		throw new Error("Failed to begin transaction");
	} finally {
		client.release();
	}
}

async function getCyclesByProgramId(programId) {
	const { rows: cycles } = await pool.query(
		"SELECT * FROM cycles WHERE program_id = $1 ORDER BY cycle_order",
		[programId],
	);

	return cycles;
}

export {
	getAllCycles,
	getAllCyclesWithoutIds,
	postNewCycle,
	getCyclesByProgramId,
};
