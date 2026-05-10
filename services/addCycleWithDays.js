import pool from "../db/pool.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as programsDb from "../db/programs/index.js";
import * as trainingDaysDb from "../db/training_days/index.js";
import toNullableNumber from "../utils/toNullableNumber.js";
import { addDays } from "date-fns";

async function addCycleWithDays({ programId, name, cycleSize, cycleOrder }) {
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

		if (
			numericCycleSize === null ||
			!Number.isInteger(numericCycleSize) ||
			numericCycleSize < 1
		) {
			throw new Error("Cycle size must be a positive integer");
		}

		const daysBeforeNewCycle = cycles
			.filter(cycle => cycle.cycle_order < numericCycleOrder)
			.reduce((sum, cycle) => sum + Number(cycle.cycle_size), 0);

		const currCycleBaseScheduledDate = addDays(
			program.start_date,
			daysBeforeNewCycle,
		);

		if (numericCycleOrder <= cycles.length) {
			await cyclesDb.updateCycleOrder(client, {
				programId,
				cycleOrder: numericCycleOrder,
			});

			await trainingDaysDb.shiftScheduledDatesFromCycleOrder(client, {
				programId,
				cycleOrder: numericCycleOrder,
				amountOfDays: numericCycleSize,
			});
		}

		const cycle = await cyclesDb.insertCycle(client, {
			programId,
			name,
			cycleSize: numericCycleSize,
			cycleOrder: numericCycleOrder,
		});

		for (let index = 0; index < numericCycleSize; index += 1) {
			await trainingDaysDb.insertTrainingDay(client, {
				cycleId: cycle.id,
				dayOrder: index + 1,
				label: `Day ${index + 1}`,
				scheduledDate: addDays(currCycleBaseScheduledDate, index),
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

export default addCycleWithDays;
