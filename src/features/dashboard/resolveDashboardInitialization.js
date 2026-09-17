import * as programsRepository from "../programs/repository.js";
import { starterWorkoutManifest } from "../starterTraining/starterWorkoutManifest.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";

/**
 * Resolves the initial Dashboard selection for an authenticated owner.
 *
 * The starter workspace is the application's explicit default training
 * context. Existing session state remains authoritative so visiting the
 * Dashboard does not overwrite a user's deliberate program selection.
 *
 * @param {{userId: number | null, sessionState?: Record<string, unknown> | null, findStarterWorkspace?: typeof programsRepository.findStarterWorkspace}} input
 * @returns {Promise<{programId: number | null, sessionState: Record<string, unknown>}>}
 */
export default async function resolveDashboardInitialization({
	userId,
	sessionState = {},
	findStarterWorkspace = programsRepository.findStarterWorkspace,
}) {
	const currentState = sessionState ?? {};
	const currentProgramId = toNullableNumber(currentState.programId);
	if (currentProgramId !== null) {
		return { programId: currentProgramId, sessionState: currentState };
	}

	if (userId === null) {
		return { programId: null, sessionState: currentState };
	}

	const starter = await findStarterWorkspace({
		userId,
		provisioningKey: starterWorkoutManifest.provisioningKey,
	});
	if (!starter) {
		return { programId: null, sessionState: currentState };
	}

	return {
		programId: starter.program_id,
		sessionState: {
			...currentState,
			programId: starter.program_id,
			cycleId: starter.cycle_id,
			dayId: starter.training_day_id,
		},
	};
}
