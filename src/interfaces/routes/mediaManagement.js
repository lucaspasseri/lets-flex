import { Router } from "express";

import { mediaManagementController } from "../controllers/mediaManagementController.js";
import { requireAdmin } from "../middleware/auth.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import validateRequestQuery from "../middleware/validateRequestQuery.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import {
	approveMediaGenerationCandidateBodySchema,
	canonicalMediaBodySchema,
	existingMediaBodySchema,
	generateMediaBodySchema,
	mediaGenerationCandidateParamsSchema,
	mediaManagementQuerySchema,
	mediaUploadBodySchema,
	regenerateMediaBodySchema,
	rejectMediaGenerationCandidateBodySchema,
	removeMediaBodySchema,
} from "../validation/mediaManagementSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);
router.use(requireAdmin);

router.get(
	"/",
	validateRequestQuery(mediaManagementQuerySchema),
	mediaManagementController.show,
);
router.post(
	"/upload",
	validateRequestBody(
		mediaUploadBodySchema,
		mediaManagementController.showUploadValidationErrors,
	),
	mediaManagementController.upload,
);
router.post(
	"/assign",
	validateRequestBody(
		existingMediaBodySchema,
		mediaManagementController.showExistingValidationErrors,
	),
	mediaManagementController.assign,
);
router.post(
	"/canonical",
	validateRequestBody(
		canonicalMediaBodySchema,
		mediaManagementController.showCanonicalValidationErrors,
	),
	mediaManagementController.promote,
);
router.post(
	"/remove",
	validateRequestBody(
		removeMediaBodySchema,
		mediaManagementController.showRemoveValidationErrors,
	),
	mediaManagementController.remove,
);
router.post(
	"/generate",
	validateRequestBody(
		generateMediaBodySchema,
		mediaManagementController.showGenerationValidationErrors,
	),
	mediaManagementController.generate,
);
router.post(
	"/regenerate",
	validateRequestBody(
		regenerateMediaBodySchema,
		mediaManagementController.showGenerationValidationErrors,
	),
	mediaManagementController.regenerate,
);
router.get(
	"/candidates/:candidateId/file",
	validateRequestParams(mediaGenerationCandidateParamsSchema),
	mediaManagementController.previewCandidate,
);
router.post(
	"/candidates/:candidateId/reject",
	validateRequestParams(mediaGenerationCandidateParamsSchema),
	validateRequestBody(
		rejectMediaGenerationCandidateBodySchema,
		mediaManagementController.showRejectValidationErrors,
	),
	mediaManagementController.rejectCandidate,
);
router.post(
	"/candidates/:candidateId/approve",
	validateRequestParams(mediaGenerationCandidateParamsSchema),
	validateRequestBody(
		approveMediaGenerationCandidateBodySchema,
		mediaManagementController.showApprovalValidationErrors,
	),
	mediaManagementController.approveCandidate,
);

export default router;
