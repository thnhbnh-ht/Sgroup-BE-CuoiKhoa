import { Router } from "express";
import * as assignmentController from "../controller/assignment.controller.js";
import * as submissionController from "../controller/submission.controller.js";
import {
  validate,
  assignmentIdParamRules,
  submitAssignmentRules,
} from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";

const router = Router();

router.get(
  "/:id",
  authenticateToken,
  assignmentController.getAssignmentById
);

router.patch(
  "/:id",
  authenticateToken,
  assignmentController.updateAssignment
);

router.delete(
  "/:id",
  authenticateToken,
  assignmentController.deleteAssignment
);

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
  uploadSingle,
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