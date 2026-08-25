import pool from "../../../db/pool.js";
import * as cyclesRepository from "./repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";

export class CycleNotFoundError extends Error {
	constructor() {
		super("Cycle not found");
		this.name = "CycleNotFoundError";
	}
}

export default async function deleteCycle(
	input,
	/** @type {any} */
	dependencies = { pool, cyclesRepository, trainingDaysRepository },
) {
	const client = await dependencies.pool.connect();
	try {
		await client.query("BEGIN");
		const deleted = await dependencies.cyclesRepository.deleteByIdForUser(
			input,
			client,
		);
		if (!deleted) throw new CycleNotFoundError();
		await dependencies.trainingDaysRepository.shiftScheduledDates(
			{
				programId: deleted.program_id,
				cycleOrder: deleted.cycle_order,
				amountOfDays: -deleted.cycle_size,
			},
			client,
		);
		await dependencies.cyclesRepository.closeCycleOrderGap(
			{ programId: deleted.program_id, cycleOrder: deleted.cycle_order },
			client,
		);
		await client.query("COMMIT");
		return deleted;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}
