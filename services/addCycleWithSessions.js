import pool from "../db/pool.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as programsDb from "../db/programs/index.js";
import * as sessionsDb from "../db/sessions/index.js";
import toNullableNumber from "../utils/toNullableNumber.js";
import range from "../utils/range.js";

async function addCycleWithSessions({
	programId,
	name,
	cycleSize,
	cycleOrder,
}) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const program = await programsDb.getProgramById(client, { programId });

		if (!program) {
			throw new Error(`Program with ID ${programId} was not found`);
		}

		const cycles = await cyclesDb.getCyclesByProgramId(client, { programId });
		const numericCycleOrder = toNullableNumber(cycleOrder);
		const numericCycleSize = toNullableNumber(cycleSize);

		if (
			numericCycleOrder === null ||
			!Number.isInteger(numericCycleOrder) ||
			numericCycleOrder < 1 ||
			numericCycleOrder > cycles.length + 1
		) {
			throw new Error(
				`Cycle order must be an integer between 1 and ${cycles.length + 1}`,
			);
		}

		if (numericCycleOrder <= cycles.length) {
			await cyclesDb.updateCycleOrder(client, {
				programId,
				cycleOrder: numericCycleOrder,
			});
		}

		const cycle = await cyclesDb.insertCycle(client, {
			programId,
			name,
			cycleSize,
			cycleOrder: numericCycleOrder,
		});

		for (let index = 0; index < numericCycleSize; index += 1) {
			await sessionsDb.insertSession(client, {
				cycleId: cycle.id,
				name: `${name}: Day ${index + 1}`,
				sessionOrder: index + 1,
			});
		}

		await client.query("COMMIT");
		return cycle.id;
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

export default addCycleWithSessions;
