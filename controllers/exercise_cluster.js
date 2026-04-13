async function addNewExerciseCluster(req, res) {
	console.log(1);

	const { body } = req;

	console.log({ body });

	res.send(200);
}

export { addNewExerciseCluster };
