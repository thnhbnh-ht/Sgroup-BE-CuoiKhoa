import { Router } from "express";
import * as uploadController from "../controller/upload.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.post(
  "/",
  authenticateToken,
  requirePermission(PERMISSIONS.UPLOAD_CREATE),
  uploadSingle,
  uploadController.uploadFile,
);

router.get("/me", authenticateToken, uploadController.getMyUploads);

router.get("/:id", authenticateToken, uploadController.getUploadById);

export default router;

