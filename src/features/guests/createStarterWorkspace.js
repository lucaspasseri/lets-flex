import { format } from "date-fns";
import * as goalsRepository from "../goals/repository.js";
import * as programsRepository from "../programs/repository.js";
import * as cyclesRepository from "../cycles/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as workoutSessionsRepository from "../workoutSessions/repository.js";
import { starterWorkoutManifest } from "./starterWorkoutManifest.js";

const defaultDependencies = {
	goalsRepository,
	programsRepository,
	cyclesRepository,
	trainingDaysRepository,
	sessionsRepository,
	workoutSessionsRepository,
};

/**
 * Creates the owned starter hierarchy for an existing principal.
 * The caller owns the transaction that creates the principal and surrounding
 * authentication identity.
 *
 * @param {{userId: number, scheduledDate?: string}} input
 * @param {any} db
 * @param {typeof defaultDependencies} [dependencies]
 */
export default async function createStarterWorkspace(
	{ userId, scheduledDate = format(new Date(), "yyyy-MM-dd") },
	db,
	dependencies = defaultDependencies,
) {
	const repositories = { ...defaultDependencies, ...dependencies };
	const goal = await repositories.goalsRepository.findByName(
		{ name: starterWorkoutManifest.goalName },
		db,
	);
	if (!goal) throw new Error("Starter goal is unavailable");

	const starterTemplate = await repositories.sessionsRepository.findActiveGlobalByName(
		{ name: starterWorkoutManifest.sessionName },
		db,
	);
	if (!starterTemplate) throw new Error("Starter session is unavailable");

	const session = await repositories.sessionsRepository.createOwnedCopy(
		{ sourceSessionId: starterTemplate.id, ownerUserId: userId },
		db,
	);
	if (!session) throw new Error("Starter session could not be copied");

	const program = await repositories.programsRepository.create(
		{
			name: starterWorkoutManifest.programName,
			userId,
			goalId: goal.id,
			startDate: scheduledDate,
		},
		db,
	);
	if (!program) throw new Error("Starter program could not be created");

	const cycle = await repositories.cyclesRepository.create(
		{
			programId: program.id,
			name: starterWorkoutManifest.cycleName,
			cycleSize: starterWorkoutManifest.cycleSize,
			cycleOrder: 1,
		},
		db,
	);
	if (!cycle) throw new Error("Starter cycle could not be created");

	const trainingDay = await repositories.trainingDaysRepository.create(
		{
			cycleId: cycle.id,
			dayOrder: 1,
			label: starterWorkoutManifest.trainingDayLabel,
			scheduledDate,
		},
		db,
	);
	if (!trainingDay) throw new Error("Starter day could not be created");

	const workoutSession = await repositories.workoutSessionsRepository.createForUser(
		{
			sessionId: session.id,
			trainingDayId: trainingDay.id,
			userId,
			notes: "",
		},
		db,
	);
	if (!workoutSession) throw new Error("Starter workout could not be created");

	return {
		programId: program.id,
		cycleId: cycle.id,
		trainingDayId: trainingDay.id,
		workoutSessionId: workoutSession.id,
	};
}
