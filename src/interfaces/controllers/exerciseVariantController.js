import asyncHandler from "../../../utils/asyncControllerHandler.js";
import * as exerciseVariantsRepository from "../../features/exerciseVariants/repository.js";

/** @param {any} error @param {any} res */
function handleConstraintError(error, res) {
	if (error?.code === "23505") {
		res.status(409).send("A variant with that name already exists for this exercise.");
		return true;
	}
	if (error?.code === "23503") {
		res.status(422).send("Choose valid related Library resources.");
		return true;
	}
	return false;
}

/** @param {any} req @param {any} res */
async function create(req, res) {
	try {
		const variant = await exerciseVariantsRepository.createPrivate({
			...req.validatedBody,
			exerciseId: req.validatedParams.exerciseId,
			ownerUserId: req.user.id,
		});
		if (!variant) {
			res.status(404).send("Exercise not found");
			return;
		}
		res.redirect(`/library#exercise-template-${variant.id}`);
	} catch (error) {
		if (!handleConstraintError(error, res)) throw error;
	}
}

/** @param {any} req @param {any} res */
async function update(req, res) {
	try {
		const variant = await exerciseVariantsRepository.updatePrivate({
			...req.validatedBody,
			variantId: req.validatedParams.variantId,
			ownerUserId: req.user.id,
		});
		if (!variant) {
			res.status(404).send("Exercise variant not found");
			return;
		}
		res.redirect(`/library#exercise-template-${variant.id}`);
	} catch (error) {
		if (!handleConstraintError(error, res)) throw error;
	}
}

/** @param {any} req @param {any} res */
async function archive(req, res) {
	const variant = await exerciseVariantsRepository.archivePrivate({
		variantId: req.validatedParams.variantId,
		ownerUserId: req.user.id,
	});
	if (!variant) {
		res.status(404).send("Exercise variant not found");
		return;
	}
	res.redirect("/library");
}

export const exerciseVariantController = {
	create: asyncHandler(create),
	update: asyncHandler(update),
	archive: asyncHandler(archive),
};
