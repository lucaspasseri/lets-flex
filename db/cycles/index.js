import pool from "../pool.js";

async function getAllCycles() {
	const { rows: cycles } = await pool.query("SELECT * FROM cycles");

	return cycles;
}

async function getAllCyclesWithoutIds() {
	const { rows: cycles } = await pool.query(
		"SELECT cycles.id, programs.name AS program_name, cycles.name AS cycle_name, cycles.cycle_order AS cycle_order FROM cycles JOIN programs ON cycles.program_id = programs.id",
	);

	return cycles;
}

async function postNewCycle(programId, name, cycleSize, cycleOrder) {
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
		const { rows } = await pool.query(
			"INSERT INTO cycles (name, program_id, cycle_size, cycle_order) VALUES ($1, $2, $3, $4) RETURNING id",
			[name, programId, Number(cycleSize), Number(cycleOrder)],
		);
		return rows[0].id;
	}

	const client = await pool.connect();

	let cycleId;
	try {
		await client.query("BEGIN");

		await client.query(
			"UPDATE cycles SET cycle_order = cycle_order + 1 WHERE program_id = $1 AND cycle_order >= $2",
			[programId, Number(cycleOrder)],
		);

		const { rows } = await client.query(
			"INSERT INTO cycles (name, program_id, cycle_size, cycle_order) VALUES ($1, $2, $3, $4) RETURNING id",
			[name, programId, Number(cycleSize), Number(cycleOrder)],
		);
		cycleId = rows[0].id;
		await client.query("COMMIT");
	} catch (err) {
		console.log({ err });
		await client.query("ROLLBACK");
		throw new Error("Failed to begin transaction");
	} finally {
		client.release();
		return cycleId;
	}
}

async function getCyclesByProgramId(programId) {
	const { rows: cycles } = await pool.query(
		"SELECT * FROM cycles WHERE program_id = $1 ORDER BY cycle_order",
		[programId],
	);

	return cycles;
}

async function verifyCycleExistence(cycleId) {
	const { rows: cycleExistence } = await pool.query(
		"SELECT COUNT(*) FROM cycles WHERE id = $1",
		[Number(cycleId)],
	);

	return cycleExistence.length > 0;
}

export {
	getAllCycles,
	getAllCyclesWithoutIds,
	postNewCycle,
	getCyclesByProgramId,
	verifyCycleExistence,
};
