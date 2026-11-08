import { Router } from "express";
import * as submissionController from "../controller/submission.controller.js";
import {
  validate,
  assignmentIdParamRules,
  submitAssignmentRules,
} from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

router.get(
  "/:id/submissions/me",
  authenticateToken,
  requirePermission("SUBMISSION_READ_OWN"),
  validate(assignmentIdParamRules),
  submissionController.getMySubmissionByAssignment,
);

router.post(
  "/:id/submissions",
  authenticateToken,
  requirePermission("SUBMISSION_CREATE"),
  validate([...assignmentIdParamRules, ...submitAssignmentRules]),
  submissionController.submitAssignment,
);

router.get(
  "/:id/submissions",
  authenticateToken,
  validate(assignmentIdParamRules),
  submissionController.getSubmissionsByAssignmentId,
);

export default router;
