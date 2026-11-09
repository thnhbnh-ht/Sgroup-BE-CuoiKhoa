import { Router } from "express";
import * as submissionController from "../controller/submission.controller.js";
import {
  validate,
  submissionIdParamRules,
  reviewSubmissionRules,
  assignmentIdParamRules,
  submitAssignmentRules,
} from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

router.get(
  "/submissions/me",
  authenticateToken,
  requirePermission("SUBMISSION_READ_OWN"),
  submissionController.getMySubmissions,
);

router.get(
  "/submissions/:id",
  authenticateToken,
  requirePermission("SUBMISSION_READ_OWN"),
  validate(submissionIdParamRules),
  submissionController.getSubmissionById,
);

router.patch(
  "/submissions/:id/review",
  authenticateToken,
  validate([...submissionIdParamRules, ...reviewSubmissionRules]),
  submissionController.reviewSubmission,
);

router.get(
  "/assignments/:id/submissions/me",
  authenticateToken,
  requirePermission("SUBMISSION_READ_OWN"),
  validate(assignmentIdParamRules),
  submissionController.getMySubmissionByAssignment,
);

router.post(
  "/assignments/:id/submissions",
  authenticateToken,
  requirePermission("SUBMISSION_CREATE"),
  validate([...assignmentIdParamRules, ...submitAssignmentRules]),
  submissionController.submitAssignment,
);

router.get(
  "/assignments/:id/submissions",
  authenticateToken,
  validate(assignmentIdParamRules),
  submissionController.getSubmissionsByAssignmentId,
);

export default router;
