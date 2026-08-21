import * as usersRepository from "../users/repository.js";
import * as programsRepository from "./repository.js";
import * as cyclesRepository from "../cycles/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as goalsRepository from "../goals/repository.js";
import * as userMapper from "../users/mapper.js";
import * as programMapper from "./mapper.js";
import * as cycleMapper from "../cycles/mapper.js";
import * as trainingDayMapper from "../trainingDays/mapper.js";
import * as goalMapper from "../goals/mapper.js";
import resolveProgramsPageSelection from "./resolveProgramsPageSelection.js";

/**
 * @typedef {import("./programsPage.types.js").ProgramsPageData} ProgramsPageData
 * @typedef {import("./programsPage.types.js").GetProgramsPageDataInput} GetProgramsPageDataInput
 */

/**
 * @param {GetProgramsPageDataInput} input
 * @returns {Promise<ProgramsPageData>}
 */

export async function getProgramsPageData({ userId, programId, cycleId }) {
	const [userRow, programRows, cycleRows, goalRows] = await Promise.all([
		usersRepository.findById({ userId }),
		userId
			? programsRepository.findAllByUserId({ userId })
			: Promise.resolve([]),
		userId ? cyclesRepository.findAllByUserId({ userId }) : Promise.resolve([]),
		goalsRepository.findAll(),
	]);

	const currentUser = userRow ? userMapper.toLoggedUser(userRow) : null;
	const programs = programRows.map(programMapper.toProgram);
	const allUserCycles = cycleRows.map(cycleMapper.toCycle);
	const goals = goalRows.map(goalMapper.toGoal);

	const { currentProgram, currentCycle, programCycles } =
		resolveProgramsPageSelection({
			programId,
			cycleId,
			programs,
			allUserCycles,
		});

	const trainingDayRows = currentProgram
		? await trainingDaysRepository.findAllByProgramId({
				programId: currentProgram.id,
			})
		: [];

	return {
		currentUser,
		programs: {
			current: currentProgram,
			items: programs,
		},
		cycles: {
			current: currentCycle,
			items: programCycles,
		},
		trainingDays: trainingDayRows.map(trainingDayMapper.toTrainingDay),
		goals,
	};
}
