import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";
import getSessionsByProgramIdAndScheduleDate from "../services/getSessionsByProgramIdAndScheduleDate.js";
import { addDays, differenceInCalendarDays } from "date-fns";

async function getIndex(req, res) {
	console.log({ l: res.locals });

	const { programId, daysDifference, sessionId } = res.locals.sessionState;
	const { currentProgram } = res.locals.appState;

	const cycleArr =
		(programId &&
			(await cyclesDb.getCyclesByProgramId(pool, {
				programId,
			}))) ??
		[];

	const currDay = new Date();

	const currProgramStartDate =
		(currentProgram && currentProgram?.start_date) ?? null;

	const sessionArr =
		(programId &&
			currProgramStartDate &&
			daysDifference !== null &&
			(await getSessionsByProgramIdAndScheduleDate(pool, {
				programId,
				currDay,
				startDate: currProgramStartDate,
				daysDifference,
			}))) ||
		[];

	res.locals.data = {
		...res.locals.data,
		cycleArr,
		sessionArr,
	};

	const getActiveCycleId = (startDate, currDay, daysDifference, cycleArr) => {
		const relativeDay =
			daysDifference !== 0 ? addDays(currDay, daysDifference) : currDay;

		if (differenceInCalendarDays(relativeDay, startDate) < 0) {
			return null;
		}

		let lastDate = startDate;
		for (let i = 0; i < cycleArr.length; i++) {
			const { id, cycle_size } = cycleArr[i];

			if (
				differenceInCalendarDays(addDays(lastDate, cycle_size), relativeDay) > 0
			) {
				return id;
			}

			lastDate = addDays(lastDate, cycle_size);
		}

		return null;
	};

	let activeCycleId;

	if (
		daysDifference !== undefined ||
		currProgramStartDate !== null ||
		cycleArr.length > 0
	) {
		activeCycleId = getActiveCycleId(
			currProgramStartDate,
			currDay,
			daysDifference,
			cycleArr,
		);
	}

	res.locals.sessionState.activeCycleId = activeCycleId;

	res.locals.page.title = "Let's Flex!";
	res.render("index");
}

export { getIndex };
