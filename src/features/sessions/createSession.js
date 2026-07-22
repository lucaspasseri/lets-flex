import pool from "../../../db/pool.js";

import * as sessionsRepository from "./repository.js";
import * as sessionStepsRepository from "../sessionSteps/repository.js";

async function createSession({ name, notes, stepRowArr }) {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		// const {
		// 	rows: [{ id: sessionId }],
		// } = await client.query(
		// 	"INSERT INTO sessions (name, notes) VALUES ($1, $2) RETURNING id",
		// 	[name, notes],
		// );

		const session = await sessionsRepository.create({ name, notes }, client);

		console.log({ session });
		console.log({ stepRowArr });

		let returningSteps = [];
		for (let i = 0; i < stepRowArr?.length; i++) {
			const { stepTypeId, exerciseVariantId, sets, reps, loadValue, loadUnit } =
				stepRowArr[i];

			console.log({ stepTypeId, exerciseVariantId });

			// const {
			// 	rows: [step],
			// } = await client.query(
			// 	"INSERT INTO session_steps (session_id, step_type_id, exercise_variant_id, name, step_order, sets, reps, load_value, load_unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
			// 	[
			// 		sessionId,
			// 		stepTypeId,
			// 		exerciseVariantId,
			// 		`Step ${i + 1}`,
			// 		i + 1,
			// 		sets,
			// 		reps,
			// 		loadValue,
			// 		loadUnit,
			// 	],
			// );

			const step = await sessionStepsRepository.create(
				{
					sessionId: session?.id,
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

			console.log({ step });

			returningSteps.push(step);
		}
		await client.query("COMMIT");
	} catch (err) {
		console.log({ err });
		await client.query("ROLLBACK");
		throw new Error(`Failed to add new session and its steps: ${err.message}`);
	} finally {
		client.release();
	}
}

export default createSession;
