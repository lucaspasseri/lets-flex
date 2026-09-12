import { addDays, format } from "date-fns";
import * as usersRepository from "../users/repository.js";
import * as programsRepository from "../programs/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as cyclesRepository from "../cycles/repository.js";
import * as workoutSessionsRepository from "../workoutSessions/repository.js";
import * as userMapper from "../users/mapper.js";
import * as programMapper from "../programs/mapper.js";
import * as trainingDayMapper from "../trainingDays/mapper.js";
import * as cycleMapper from "../cycles/mapper.js";
import * as workoutSessionMapper from "../workoutSessions/mapper.js";
import getHeatmapArr from "./getHeatmapArr.js";
import getBarChartData from "./getBarChartData.js";
import resolveDashboardSelection from "./resolveDashboardSelection.js";
import getProgramAnalytics from "../programAnalytics/getProgramAnalytics.js";
import { emptyProgramAnalytics } from "../programAnalytics/mapper.js";

/** @param {import("./dashboardPage.types.js").GetDashboardPageDataInput} input @returns {Promise<import("./dashboardPage.types.js").DashboardPageData>} */
export default async function getDashboardPageData({
	userId,
	programId,
	daysDifference,
	workoutSessionId,
	locale,
	now = new Date(),
}) {
	const selectedDate = addDays(now, daysDifference ?? 0);
	const ownedProgram =
		programId && userId
			? await programsRepository.findByIdForUser({ programId, userId })
			: null;
	const ownedProgramId = ownedProgram?.id ?? null;
	const [
		userRow,
		programRow,
		trainingDayRow,
		cycleRows,
		scheduledWorkoutSessionRows,
		analyticsResult,
	] = await Promise.all([
		userId ? usersRepository.findById({ userId }) : Promise.resolve(null),
		Promise.resolve(ownedProgram),
		ownedProgramId
			? trainingDaysRepository.findByProgramIdAndScheduledDate({
					programId: ownedProgramId,
					scheduledDate: selectedDate,
				})
			: Promise.resolve(null),
		ownedProgramId
			? cyclesRepository.findAllByProgramId({ programId: ownedProgramId })
			: Promise.resolve([]),
		ownedProgramId && userId
			? workoutSessionsRepository.findMarkersByProgramIdAndDateRangeForUser({
					programId: ownedProgramId,
					userId,
					startDate: format(addDays(selectedDate, -3), "yyyy-MM-dd"),
					endDate: format(addDays(selectedDate, 3), "yyyy-MM-dd"),
				})
			: Promise.resolve([]),
		ownedProgramId && userId
			? getProgramAnalytics({ programId: ownedProgramId, userId })
			: Promise.resolve(null),
	]);

	const currentDayWorkoutSessionRows = trainingDayRow?.id
		? await workoutSessionsRepository.findAllByTrainingDayId({
				trainingDayId: trainingDayRow.id,
				locale,
			})
		: [];
	const currentUser = userRow ? userMapper.toLoggedUser(userRow) : null;
	const currentProgram = programRow ? programMapper.toProgram(programRow) : null;
	const cycles = cycleRows.map(cycleMapper.toCycle);
	const mappedTrainingDay = trainingDayRow
		? trainingDayMapper.toTrainingDay(trainingDayRow)
		: null;
	const currentTrainingDay =
		mappedTrainingDay && ownedProgramId !== null
			? {
					...mappedTrainingDay,
					programId: ownedProgramId,
					cycleOrder:
						cycles.find(
							/** @param {import("../cycles/cycles.types.js").Cycle} cycle */ (cycle) =>
								cycle.id === mappedTrainingDay.cycleId,
						)?.order ?? 0,
				}
			: null;
	const scheduledWorkoutSessions = scheduledWorkoutSessionRows.map((row) => ({
		id: row.id,
		status: row.status,
		scheduledDate: row.scheduled_date,
	}));
	const currentDayWorkoutSessions = currentDayWorkoutSessionRows.map(
		workoutSessionMapper.toWorkoutSession,
	);
	const selection = resolveDashboardSelection({
		workoutSessionId,
		trainingDay: currentTrainingDay,
		cycles,
		workoutSessions: currentDayWorkoutSessions,
	});
	const analytics = analyticsResult ?? emptyProgramAnalytics();

	return {
		currentUser,
		currentProgram,
		selectedDate,
		currentTrainingDay,
		...selection,
		cycles,
		scheduledWorkoutSessions,
		analytics,
		heatmap: getHeatmapArr(
			currentProgram?.startDate ?? null,
			cycles,
			analytics.activity,
		),
		barChart: getBarChartData(analytics.adherence),
	};
}
