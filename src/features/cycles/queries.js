export function bumpCycleOrdersQuery() {
	return `
    UPDATE cycles
    SET cycle_order = cycle_order + 1000
    WHERE program_id = $1
      AND cycle_order >= $2
  `;
}

export function normalizeCycleOrdersQuery() {
	return `
    UPDATE cycles
    SET cycle_order = cycle_order - 999
    WHERE program_id = $1
      AND cycle_order >= $2 + 1000
  `;
}
