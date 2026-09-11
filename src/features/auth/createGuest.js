import { randomUUID } from "node:crypto";
import { format } from "date-fns";
import pool from "../../../db/pool.js";
import * as usersRepository from "../users/repository.js";
import * as goalsRepository from "../goals/repository.js";
import * as programsRepository from "../programs/repository.js";
import * as cyclesRepository from "../cycles/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as workoutSessionsRepository from "../workoutSessions/repository.js";
import { starterWorkoutManifest } from "../guests/starterWorkoutManifest.js";

export const GUEST_TTL_DAYS = 15;

const defaultDependencies = {
	pool,
	usersRepository,
	goalsRepository,
	programsRepository,
	cyclesRepository,
	trainingDaysRepository,
	sessionsRepository,
	workoutSessionsRepository,
};

/**
 * Creates the temporary principal and its starter training hierarchy atomically.
 *
 * @param {{now?: Date, ttlDays?: number}} [input]
 * @param {any} [dependencies]
 */
export default async function createGuest(
	{
		now = new Date(),
		ttlDays = Number(process.env.GUEST_TTL_DAYS || GUEST_TTL_DAYS),
	} = {},
	dependencies = defaultDependencies,
) {
	if (!Number.isInteger(ttlDays) || ttlDays <= 0) {
		throw new Error("GUEST_TTL_DAYS must be a positive integer");
	}

	const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
	const scheduledDate = format(now, "yyyy-MM-dd");
	const suffix = randomUUID().slice(0, 8);
	const client = await dependencies.pool.connect();

	try {
		await client.query("BEGIN");

		const goal = await dependencies.goalsRepository.findByName(
			{ name: starterWorkoutManifest.goalName },
			client,
		);
		if (!goal) throw new Error("Guest starter goal is unavailable");

		const starterTemplate =
			await dependencies.sessionsRepository.findActiveGlobalByName(
				{ name: starterWorkoutManifest.sessionName },
				client,
			);
		if (!starterTemplate) throw new Error("Guest starter session is unavailable");

		const guest = await dependencies.usersRepository.createGuest(
			{
				name: `Guest ${suffix}`,
				expiresAt,
			},
			client,
		);
		if (!guest) throw new Error("Guest account could not be created");

		const session = await dependencies.sessionsRepository.createOwnedCopy(
			{ sourceSessionId: starterTemplate.id, ownerUserId: guest.id },
			client,
		);
		if (!session) throw new Error("Guest starter session could not be copied");

		const program = await dependencies.programsRepository.create(
			{
				name: starterWorkoutManifest.programName,
				userId: guest.id,
				goalId: goal.id,
				startDate: scheduledDate,
			},
			client,
		);
		if (!program) throw new Error("Guest starter program could not be created");

		const cycle = await dependencies.cyclesRepository.create(
			{
				programId: program.id,
				name: starterWorkoutManifest.cycleName,
				cycleSize: starterWorkoutManifest.cycleSize,
				cycleOrder: 1,
			},
			client,
		);
		if (!cycle) throw new Error("Guest starter cycle could not be created");

		const trainingDay = await dependencies.trainingDaysRepository.create(
			{
				cycleId: cycle.id,
				dayOrder: 1,
				label: starterWorkoutManifest.trainingDayLabel,
				scheduledDate,
			},
			client,
		);
		if (!trainingDay) throw new Error("Guest starter day could not be created");

		const workoutSession = await dependencies.workoutSessionsRepository.createForUser(
			{
				sessionId: session.id,
				trainingDayId: trainingDay.id,
				userId: guest.id,
				notes: "",
			},
			client,
		);
		if (!workoutSession) {
			throw new Error("Guest starter workout could not be created");
		}

		await client.query("COMMIT");

		return {
			user: guest,
			starter: {
				programId: program.id,
				cycleId: cycle.id,
				trainingDayId: trainingDay.id,
				workoutSessionId: workoutSession.id,
			},
		};
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}
