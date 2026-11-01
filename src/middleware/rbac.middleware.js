import { ForbiddenError } from "../core/error.response.js";
import { findPermissionsByUserId } from "../repository/user.repository.js";

export const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            const permissions = await findPermissionsByUserId(req.user.id);

            if (!permissions.includes(permission)) {
                throw new ForbiddenError(
                    "Bạn không có quyền thực hiện hành động này!",
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};