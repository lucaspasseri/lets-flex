import pool from "../../../db/pool.js";
import * as sessionsRepository from "./repository.js";
import * as sessionStepsRepository from "../sessionSteps/repository.js";

export class SessionTemplateNotFoundError extends Error {
	constructor() {
		super("Session template not found");
		this.name = "SessionTemplateNotFoundError";
	}
}

const defaultDependencies = { pool, sessionsRepository, sessionStepsRepository };

/** @param {any} input @param {any} dependencies */
export async function updateSessionTemplate(input, dependencies = defaultDependencies) {
	const client = await dependencies.pool.connect();
	try {
		await client.query("BEGIN");
		const exists = await dependencies.sessionsRepository.update(input, client);
		if (!exists) throw new SessionTemplateNotFoundError();

		await dependencies.sessionStepsRepository.moveOrdersOutOfWay(input, client);
		const retainedStepIds = [];
		for (const [index, step] of input.stepRow.entries()) {
			const values = {
				...step,
				sessionId: input.sessionId,
				name: `Step ${index + 1}`,
				stepOrder: index + 1,
			};
			if (step.stepId != null) {
				const updated = await dependencies.sessionStepsRepository.update(
					values,
					client,
				);
				if (!updated) throw new SessionTemplateNotFoundError();
				retainedStepIds.push(step.stepId);
			} else {
				const created = await dependencies.sessionStepsRepository.create(
					values,
					client,
				);
				if (!created?.id) throw new Error("Failed to create session step");
				retainedStepIds.push(created.id);
			}
		}
		await dependencies.sessionStepsRepository.deleteExcept(
			{ sessionId: input.sessionId, stepIds: retainedStepIds },
			client,
		);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export default updateSessionTemplate;
