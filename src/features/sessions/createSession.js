import pool from "../../../db/pool.js";

import * as sessionsRepository from "./repository.js";
import * as sessionStepsRepository from "../sessionSteps/repository.js";
import * as exerciseVariantsRepository from "../exerciseVariants/repository.js";

async function createSession({ name, notes, stepRowArr, ownerUserId }) {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const session = await sessionsRepository.create(
			{ name, notes, ownerUserId },
			client,
		);
		if (!session) {
			throw new Error("Session could not be created");
		}

		for (let i = 0; i < stepRowArr?.length; i++) {
			const { stepTypeId, exerciseVariantId, sets, reps, loadValue, loadUnit } =
				stepRowArr[i];
			const canUseVariant = await exerciseVariantsRepository.isVisibleToUser(
				{ variantId: exerciseVariantId, userId: ownerUserId },
				client,
			);
			if (!canUseVariant) throw new Error("Exercise variant not found");

			await sessionStepsRepository.create(
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
		}
		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		throw new Error("Failed to create session template", { cause: err });
	} finally {
		client.release();
	}
}

export default createSession;
