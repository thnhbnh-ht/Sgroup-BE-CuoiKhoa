import { Router } from "express";
import * as assignmentController from "../controller/assignment.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

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

export default router;