import pool from "../../../db/pool.js";
import * as programsRepository from "../programs/repository.js";
import * as cyclesRepository from "./repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import { addDays } from "date-fns";
import toNullableNumber from "../../../utils/toNullableNumber.js";

export class CycleOrderOutOfRangeError extends Error {
	constructor(maximumOrder) {
		super(`Cycle order must be between 1 and ${maximumOrder}.`);
		this.name = "CycleOrderOutOfRangeError";
	}
}

async function createCycle({ programId, userId, name, cycleSize, cycleOrder }) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const program = await programsRepository.findByIdForUser(
			{ programId, userId },
			client,
		);

		if (!program) {
			throw new Error(`Program with ID ${programId} was not found`);
		}

		const cycles = await cyclesRepository.findAllByProgramId({ programId }, client);

		const numericCycleOrder = toNullableNumber(cycleOrder);
		const numericCycleSize = toNullableNumber(cycleSize);

		if (
			numericCycleOrder === null ||
			!Number.isInteger(numericCycleOrder) ||
			numericCycleOrder < 1 ||
			numericCycleOrder > cycles.length + 1
		) {
			throw new CycleOrderOutOfRangeError(cycles.length + 1);
		}

		if (
			numericCycleSize === null ||
			!Number.isInteger(numericCycleSize) ||
			numericCycleSize < 1
		) {
			throw new Error("Cycle size must be a positive integer");
		}

		const daysBeforeNewCycle = cycles
			.filter((cycle) => cycle.cycle_order < numericCycleOrder)
			.reduce((sum, cycle) => sum + Number(cycle.cycle_size), 0);

		const currCycleBaseScheduledDate = addDays(program.start_date, daysBeforeNewCycle);

		if (numericCycleOrder <= cycles.length) {
			await cyclesRepository.shiftCycleOrder(
				{
					programId,
					cycleOrder: numericCycleOrder,
				},
				client,
			);

			await trainingDaysRepository.shiftScheduledDates(
				{
					programId,
					cycleOrder: numericCycleOrder,
					amountOfDays: numericCycleSize,
				},
				client,
			);
		}

		const cycle = await cyclesRepository.create(
			{
				programId,
				name,
				cycleSize: numericCycleSize,
				cycleOrder: numericCycleOrder,
			},
			client,
		);

		for (let index = 0; index < numericCycleSize; index += 1) {
			await trainingDaysRepository.create(
				{
					cycleId: cycle?.id,
					dayOrder: index + 1,
					label: `Day ${index + 1}`,
					scheduledDate: addDays(currCycleBaseScheduledDate, index),
				},
				client,
			);
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

export default createCycle;
