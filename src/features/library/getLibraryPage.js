import toNullableNumber from "../../../utils/toNullableNumber.js";
import * as usersRepository from "../users/repository.js";
import * as equipmentsRepository from "../equipments/repository.js";
import * as movementPatternsRepository from "../movementPatterns/repository.js";
import * as musclesRepository from "../muscles/repository.js";
import * as muscleRolesRepository from "../muscleRoles/repository.js";
import * as exerciseVariantsRepository from "../exerciseVariants/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as stepTypesRepository from "../stepTypes/repository.js";
// import { toSessionViewModel } from "../../../views/viewModels/toSessionViewModel.js";
import { toSessionViewModel } from "../../../views/viewModels/toSessionViewModel.js";

export async function getLibraryPage({ query, sessionState }) {
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
		usersRepository.findById({ userId }),
		equipmentsRepository.findAll(),
		movementPatternsRepository.findAll(),
		musclesRepository.findAll(),
		muscleRolesRepository.findAll(),
		exerciseVariantsRepository.findAll(),
		sessionsRepository.findAll(),
		stepTypesRepository.findAll(),
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
