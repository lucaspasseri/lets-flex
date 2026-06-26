import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import * as equipmentsDb from "../db/equipments/index.js";
import * as movementPatternsDb from "../db/movement_patterns/index.js";
import * as musclesDb from "../db/muscles/index.js";
import * as muscleRolesDb from "../db/muscle_roles/index.js";
import * as sessionsDb from "../db/sessions/index.js";
import * as stepTypesDb from "../db/step_types/index.js";
import * as exerciseVariantsDb from "../db/exercise_variants/index.js";
import { toSessionViewModel } from "../views/viewModels/toSessionViewModel.js";
import toNullableNumber from "../utils/toNullableNumber.js";

async function getLibraryPage({ query, sessionState }) {
	const pageState = { sessionId: toNullableNumber(query?.sessionId) };

	const { userId } = sessionState;

	const [
		user,
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseVariantArr,
		sessionArr,
		stepTypeArr,
	] = await Promise.all([
		usersDb.getUserById(pool, { userId }),
		equipmentsDb.getAllEquipments(pool),
		movementPatternsDb.getAllMovementPatterns(pool),
		musclesDb.getAllMuscles(pool),
		muscleRolesDb.getAllMuscleRoles(pool),
		exerciseVariantsDb.getAllExerciseVariants(pool),
		sessionsDb.getAllSessionsWithExerciseInfo(pool),
		stepTypesDb.getAllStepTypes(pool),
	]);

	const shapedSessionArr = sessionArr.map(session =>
		toSessionViewModel(session, { type: "template" }),
	);

	const session = pageState.sessionId
		? await sessionsDb.getSessionWithExerciseInfoById(pool, {
				sessionId: pageState.sessionId,
			})
		: null;

	return {
		pageState,
		appState: { user, session },
		data: {
			exerciseVariants: {
				items: exerciseVariantArr,
			},
			sessions: {
				items: shapedSessionArr,
			},
			equipments: {
				items: equipmentArr,
			},
			movementPatterns: {
				items: movementPatternArr,
			},
			muscles: {
				items: muscleArr,
			},
			muscleRoles: {
				items: muscleRoleArr,
			},
			stepTypes: {
				items: stepTypeArr,
			},
		},
	};
}

export { getLibraryPage };
