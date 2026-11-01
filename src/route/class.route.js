import { Router } from "express";
import * as classController from "../controller/class.controller.js";
import {
  validate,
  classIdParamRules,
  createClassRules,
  updateClassRules,
  addClassMemberRules,
  memberIdParamRules,
  assignMentorRules,
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
  classController.getClassMembers,
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

export default router;
