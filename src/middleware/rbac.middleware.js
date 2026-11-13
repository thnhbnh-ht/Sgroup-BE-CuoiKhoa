import { ForbiddenError } from "../core/error.response.js";
import { findPermissionsByUserId } from "../repository/user.repository.js";

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // ưu tiên đọc trực tiếp permissions từ JWT token payload (0 DB query)
      let permissions = req.user?.permissions;

      // fallback query db khi dùng token cũ chưa nhúng permissions
      if (!permissions) {
        permissions = await findPermissionsByUserId(req.user.id);
        if (req.user) {
          req.user.permissions = permissions;
        }
      }

      if (!permissions.includes(permission)) {
        throw new ForbiddenError("You do not have permission to perform this action!");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};