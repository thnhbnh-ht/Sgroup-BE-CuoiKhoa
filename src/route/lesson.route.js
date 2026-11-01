import { Router } from "express";
import * as lessonController from "../controller/lesson.controller.js";
import {
  validate,
  lessonIdParamRules,
  updateLessonRules,
} from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/:id",
  authenticateToken,
  validate(lessonIdParamRules),
  lessonController.getLessonById,
);

router.patch(
  "/:id",
  authenticateToken,
  validate([...lessonIdParamRules, ...updateLessonRules]),
  lessonController.updateLesson,
);

router.delete(
  "/:id",
  authenticateToken,
  validate(lessonIdParamRules),
  lessonController.deleteLesson,
);

router.post(
  "/:id/complete",
  authenticateToken,
  validate(lessonIdParamRules),
  lessonController.completeLesson,
);

export default router;
