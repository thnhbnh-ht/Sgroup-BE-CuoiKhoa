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

const router = Router();

router.get(
  "/",
  authenticateToken,
  requirePermission("USER_READ"),
  userController.getAllUsers,
);
router.get(
  "/:id",
  authenticateToken,
  requirePermission("USER_READ"),
  validate(userIdParamRules),
  userController.getUserById,
);
router.post(
  "/",
  authenticateToken,
  requirePermission("USER_CREATE"),
  validate(createUserRules),
  userController.createUser,
);
router.patch(
  "/:id",
  authenticateToken,
  requirePermission("USER_UPDATE"),
  validate([...userIdParamRules, ...updateUserRules]),
  userController.updateUser,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("USER_DELETE"),
  validate(userIdParamRules),
  userController.deleteUser,
);

export default router;
