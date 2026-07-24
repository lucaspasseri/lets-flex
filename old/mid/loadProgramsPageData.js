import * as programsDb from "../../db/programs/index.js";
import * as cyclesDb from "../../db/cycles/index.js";
import * as goalsDb from "../../db/goals/index.js";
import getTrainingDaysByProgramId from "../../services/getTrainingDaysByProgramId.js";
import pool from "../../db/pool.js";

const loadProgramsPageData = async (req, res, next) => {
	const { userId, programId } = res.locals.sessionState;

	const [programArr, cycleArr, trainingDayArr, goalArr] = await Promise.all([
		userId
			? programsDb.getProgramsByUserId(pool, {
					userId,
				})
			: [],
		programId
			? cyclesDb.getCyclesByProgramId(pool, {
					programId,
				})
			: [],
		programId
			? getTrainingDaysByProgramId(pool, {
					programId,
				})
			: [],
		goalsDb.getAllGoals(),
	]);

	res.locals.data = {
		...res.locals.data,
		programArr,
		cycleArr,
		trainingDayArr,
		goalArr,
	};

	next();
};
export { loadProgramsPageData };
