import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as trainingDaysDb from "../db/training_days/index.js";
import * as goalsDb from "../db/goals/index.js";
import toNullableNumber from "../utils/toNullableNumber.js";

async function getProgramsPage({ query, sessionState }) {
	const { userId } = sessionState;
	const pageState = {
		programId: toNullableNumber(query?.programId),
		cycleId: toNullableNumber(query?.cycleId),
	};
	const programId = query?.programId ?? sessionState?.programId ?? null;
	const cycleId = query?.cycleId ?? sessionState?.cycleId ?? null;

	const [user, program, programArr, cycle, cycleArr, trainingDayArr, goalsArr] =
		await Promise.all([
			usersDb.getUserById(pool, { userId }),
			programsDb.getProgramById(pool, { programId }),
			programsDb.getProgramsByUserId(pool, { userId }),
			cyclesDb.getCycleById(pool, { cycleId }),
			cyclesDb.getCyclesByProgramId(pool, { programId }),
			trainingDaysDb.getTrainingDaysByProgramId(pool, { programId }),
			goalsDb.getAllGoals(pool),
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

export { getProgramsPage };
