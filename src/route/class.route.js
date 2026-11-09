import { Router } from "express";
import * as classController from "../controller/class.controller.js";
import * as lessonController from "../controller/lesson.controller.js";
import * as assignmentController from "../controller/assignment.controller.js";
import {
  validate,
  classIdParamRules,
  createClassRules,
  updateClassRules,
  addClassMemberRules,
  memberIdParamRules,
  assignMentorRules,
  createLessonRules,
  createAssignmentRules,
} from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

router.get(
  "/",
  authenticateToken,
  requirePermission("CLASS_READ"),
  classController.getAllClasses,
);

router.get(
  "/:id",
  authenticateToken,
  requirePermission("CLASS_READ"),
  validate(classIdParamRules),
  classController.getClassById,
);

router.post(
  "/",
  authenticateToken,
  requirePermission("CLASS_CREATE"),
  validate(createClassRules),
  classController.createClass,
);

router.patch(
  "/:id",
  authenticateToken,
  requirePermission("CLASS_UPDATE"),
  validate([...classIdParamRules, ...updateClassRules]),
  classController.updateClass,
);

router.patch(
  "/:id/mentor",
  authenticateToken,
  requirePermission("CLASS_UPDATE"),
  validate([...classIdParamRules, ...assignMentorRules]),
  classController.assignMentor,
);

router.delete(
  "/:id",
  authenticateToken,
  requirePermission("CLASS_DELETE"),
  validate(classIdParamRules),
  classController.deleteClass,
);

router.get(
  "/:id/members",
  authenticateToken,
  requirePermission("CLASS_READ"),
  validate(classIdParamRules),
  classController.getMembersOfClass,
);

router.post(
  "/:id/members",
  authenticateToken,
  requirePermission("CLASS_MEMBER_ADD"),
  validate([...classIdParamRules, ...addClassMemberRules]),
  classController.addClassMember,
);

router.delete(
  "/:id/members/:memberId",
  authenticateToken,
  requirePermission("CLASS_MEMBER_REMOVE"),
  validate([...classIdParamRules, ...memberIdParamRules]),
  classController.removeClassMember,
);

router.get(
  "/:id/lessons",
  authenticateToken,
  validate(classIdParamRules),
  lessonController.getLessonsByClassId,
);

router.post(
  "/:id/lessons",
  authenticateToken,
  validate([...classIdParamRules, ...createLessonRules]),
  lessonController.createLesson,
);

router.get(
  "/:id/progress",
  authenticateToken,
  validate(classIdParamRules),
  lessonController.getClassProgress,
);

router.get(
  "/:id/assignments",
  authenticateToken,
  validate(classIdParamRules),
  assignmentController.getAssignmentsByClassId
);

router.post(
  "/:id/assignments",
  authenticateToken,
  validate([...classIdParamRules, ...createAssignmentRules]),
  assignmentController.createAssignment
);
export default router;
