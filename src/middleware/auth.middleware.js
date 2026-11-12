import { UnauthorizedError } from "../core/error.response.js";
import { verifyAccessToken } from "../utils/jwt.helper.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError(
      "Unauthorized! Please provide a valid token.",
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError(
        "Token has expired, please log in again!",
      );
    }

    throw new UnauthorizedError(
      "Invalid or tampered token!",
    );
  }
};