import { Router } from "express";
import * as userController from "../controller/users.controller.js";
import {
  validate,
  createUserRules,
  updateUserRules,
  userIdParamRules,
} from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get(
  "/",
  authenticateToken,
  requirePermission(PERMISSIONS.USER_READ),
  userController.getAllUsers,
);
router.get(
  "/:id",
  authenticateToken,
  requirePermission(PERMISSIONS.USER_READ),
  validate(userIdParamRules),
  userController.getUserById,
);
router.post(
  "/",
  authenticateToken,
  requirePermission(PERMISSIONS.USER_CREATE),
  validate(createUserRules),
  userController.createUser,
);
router.patch(
  "/:id",
  authenticateToken,
  requirePermission(PERMISSIONS.USER_UPDATE),
  validate([...userIdParamRules, ...updateUserRules]),
  userController.updateUser,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission(PERMISSIONS.USER_DELETE),
  validate(userIdParamRules),
  userController.deleteUser,
);

export default router;
