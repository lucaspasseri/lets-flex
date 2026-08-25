import * as usersRepository from "../users/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as equipmentsRepository from "../equipments/repository.js";
import * as movementPatternsRepository from "../movementPatterns/repository.js";
import * as musclesRepository from "../muscles/repository.js";
import * as muscleRolesRepository from "../muscleRoles/repository.js";
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

/**
 * @typedef {import("../users/users.types.js").User} User
 * @typedef {import("../sessions/sessions.types.js").SessionRow} SessionRow
 * @typedef {import("../sessions/sessions.types.js").SessionMapper} Session
 * @typedef {import("./libraryPageData.types.js").LibraryPageData} LibraryPageData
 */

/**
 * @typedef {object} GetLibraryPageData
 * @property {User["id"] | null} userId
 * @property {SessionRow["id"] | null} sessionId
 */

/**
 * @param {GetLibraryPageData} input
 * @returns {Promise<LibraryPageData>}
 */

async function getLibraryPageData({ userId, sessionId }) {
	const [
		user,
		sessionArr,
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseTemplateArr,
		stepTypeArr,
	] = await Promise.all([
		usersRepository.findById({ userId }),
		sessionsRepository.findAll(),
		equipmentsRepository.findAll(),
		movementPatternsRepository.findAll(),
		musclesRepository.findAll(),
		muscleRolesRepository.findAll(),
		exerciseTemplatesRepository.findAll(),
		stepTypesRepository.findAll(),
	]);

	const sessions = /** @type {Session[]} */ (
		sessionArr.map(sessionMapper.toSessionMapperSeed)
	);

	return {
		user: user ? userMapper.toLoggedUser(user) : null,
		activeSession: sessions.find((session) => session.id === sessionId) ?? null,
		sessions,
		equipments: equipmentArr.map(equipmentMapper.toEquipment),
		movementPatterns: movementPatternArr.map(movementPatternMapper.toMovementPattern),
		muscles: muscleArr.map(muscleMapper.toMuscle),
		muscleRoles: muscleRoleArr.map(muscleRoleMapper.toMuscleRole),
		exerciseTemplates: exerciseTemplateArr.map(
			exerciseTemplateMapper.toExerciseTemplateSeed,
		),
		stepTypes: stepTypeArr.map(stepTypeMapper.toStepType),
	};
}

export default getLibraryPageData;
