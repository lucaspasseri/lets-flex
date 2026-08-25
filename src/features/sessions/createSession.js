import pool from "../../../db/pool.js";

import * as sessionsRepository from "./repository.js";
import * as sessionStepsRepository from "../sessionSteps/repository.js";

async function createSession({ name, notes, stepRowArr }) {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const session = await sessionsRepository.create({ name, notes }, client);
		if (!session) {
			throw new Error("Session could not be created");
		}

		let returningSteps = [];
		for (let i = 0; i < stepRowArr?.length; i++) {
			const { stepTypeId, exerciseVariantId, sets, reps, loadValue, loadUnit } =
				stepRowArr[i];

			const step = await sessionStepsRepository.create(
				{
					sessionId: session.id,
					stepTypeId,
					exerciseVariantId,
					name: `Step ${i + 1}`,
					stepOrder: i + 1,
					sets,
					reps,
					loadUnit,
					loadValue,
				},
				client,
			);

			returningSteps.push(step);
		}
		await client.query("COMMIT");
	} catch (err) {
		console.log({ err });
		await client.query("ROLLBACK");
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`Failed to add new session and its steps: ${message}`);
	} finally {
		client.release();
	}
}

export default createSession;
