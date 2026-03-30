import pool from "../pool.js";

async function getAllEquipments() {
	const { rows } = await pool.query("SELECT * FROM equipments");
	return rows;
}
export { getAllEquipments };
