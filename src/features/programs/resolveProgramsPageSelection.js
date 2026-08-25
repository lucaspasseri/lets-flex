/**
 * @typedef {import("./programs.types.js").Program} Program
 * @typedef {import("../cycles/cycles.types.js").Cycle} Cycle
 */

/**
 * Resolves only selections that belong to the active user's program hierarchy.
 *
 * @param {{programId: Program["id"] | null, cycleId: Cycle["id"] | null, programs: Program[], allUserCycles: Cycle[]}} input
 */
export default function resolveProgramsPageSelection({
	programId,
	cycleId,
	programs,
	allUserCycles,
}) {
	const currentProgram = programs.find((program) => program.id === programId) ?? null;
	const programCycles = currentProgram
		? allUserCycles.filter((cycle) => cycle.programId === currentProgram.id)
		: [];
	const currentCycle = programCycles.find((cycle) => cycle.id === cycleId) ?? null;

	return { currentProgram, currentCycle, programCycles };
}
