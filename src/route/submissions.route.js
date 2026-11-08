import { Router } from "express";
import * as submissionController from "../controller/submission.controller.js";
import {
  validate,
  submissionIdParamRules,
  reviewSubmissionRules,
} from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

router.get(
  "/me",
  authenticateToken,
  requirePermission("SUBMISSION_READ_OWN"),
  submissionController.getMySubmissions,
);

router.get(
  "/:id",
  authenticateToken,
  requirePermission("SUBMISSION_READ_OWN"),
  validate(submissionIdParamRules),
  submissionController.getSubmissionById,
);

router.patch(
  "/:id/review",
  authenticateToken,
  validate([...submissionIdParamRules, ...reviewSubmissionRules]),
  submissionController.reviewSubmission,
);

export default router;
