async function getAllEquipments(db) {
	const { rows } = await db.query("SELECT * FROM equipments");
	return rows;
}
export { getAllEquipments };
