import toNullableNumber from "../../../utils/toNullableNumber.js";
import * as usersRepository from "../users/repository.js";
import * as programsRepository from "./repository.js";
import * as cyclesRepository from "../cycles/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as goalsRepository from "../goals/repository.js";

export async function getProgramsPage({ query, sessionState }) {
	const { userId } = sessionState;
	const pageState = {
		programId: toNullableNumber(query?.programId),
		cycleId: toNullableNumber(query?.cycleId),
	};
	const programId = query?.programId ?? sessionState?.programId ?? null;
	const cycleId = query?.cycleId ?? sessionState?.cycleId ?? null;

	const [user, program, programArr, cycle, cycleArr, trainingDayArr, goalsArr] =
		await Promise.all([
			usersRepository.findById({ userId }),
			programsRepository.findById({ programId }),
			programsRepository.findAllByUserId({ userId }),
			cyclesRepository.findById({ cycleId }),
			cyclesRepository.findAllByProgramId({ programId }),
			trainingDaysRepository.findAllByProgramId({ programId }),
			goalsRepository.findAll(),
		]);

	return {
		pageState,
		appState: { user, program, cycle },
		data: {
			programs: {
				items: programArr,
			},
			cycles: {
				items: cycleArr,
			},
			trainingDays: {
				items: trainingDayArr,
			},
			goals: {
				items: goalsArr,
			},
		},
	};
}
