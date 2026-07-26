import toNullableNumber from "../../../utils/toNullableNumber.js";
import * as usersRepository from "../users/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as equipmentsRepository from "../equipments/repository.js";
import * as movementPatternsRepository from "../movementPatterns/repository.js";
import * as musclesRepository from "../muscles/repository.js";
import * as muscleRolesRepository from "../muscleRoles/repository.js";
import * as exerciseVariantsRepository from "../exerciseVariants/repository.js";
import * as stepTypesRepository from "../stepTypes/repository.js";
import * as exerciseTemplatesRepository from "../exerciseTemplates/repository.js";
import * as userMapper from "../users/mapper.js";
import * as sessionMapper from "../sessions/mapper.js";
import * as equipmentMapper from "../equipments/mapper.js";
import * as movementPatternMapper from "../movementPatterns/mapper.js";
import * as muscleMapper from "../muscles/mapper.js";
import * as muscleRoleMapper from "../muscleRoles/mapper.js";
import * as exerciseTemplateMapper from "../exerciseTemplates/mapper.js";
import * as stepTypeMapper from "../stepTypes/mapper.js";

async function getLibraryPageData({ userId, sessionId }) {
	const [
		user,
		session,
		sessionArr,
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseTemplateArr,
		stepTypeArr,
	] = await Promise.all([
		usersRepository.findById({ userId }),
		sessionsRepository.findById({ sessionId }),
		sessionsRepository.findAll(),
		equipmentsRepository.findAll(),
		movementPatternsRepository.findAll(),
		musclesRepository.findAll(),
		muscleRolesRepository.findAll(),
		exerciseTemplatesRepository.findAll(),
		stepTypesRepository.findAll(),
	]);

	return {
		user: user && userMapper.toLoggedUser(user),
		session: session && sessionMapper.toSessionTemplateSeed(session),
		sessionArr: sessionArr.length
			? sessionArr.map(sessionMapper.toSessionTemplateSeed)
			: [],
		equipmentArr: equipmentArr.length
			? equipmentArr.map(equipmentMapper.toEquipment)
			: [],
		movementPatternArr: movementPatternArr.length
			? movementPatternArr.map(movementPatternMapper.toMovementPattern)
			: [],
		muscleArr: muscleArr.length ? muscleArr.map(muscleMapper.toMuscle) : [],
		muscleRoleArr: muscleRoleArr.length
			? muscleRoleArr.map(muscleRoleMapper.toMuscleRole)
			: [],
		exerciseTemplateArr: exerciseTemplateArr.length
			? exerciseTemplateArr.map(exerciseTemplateMapper.toExerciseTemplateSeed)
			: [],
		stepTypeArr: stepTypeArr.length
			? stepTypeArr.map(stepTypeMapper.toStepType)
			: [],
	};
}

export default getLibraryPageData;
