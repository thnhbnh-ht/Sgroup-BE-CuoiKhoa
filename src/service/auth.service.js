import * as userRepository from "../repository/user.repository.js";
import { config } from "../config/env.config.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../core/error.response.js";
import { hashPassword, comparePassword } from "../utils/password.helper.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken, 
} from "../utils/jwt.helper.js";

export const register = async ({ name, email, password }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ConflictError("Email is already in use!");
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await userRepository.create({
    name,
    email,
    password: hashedPassword,
  });

  return newUser;
};

export const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Incorrect email or password!");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("Incorrect email or password!");
  }

  const permissions = await userRepository.findPermissionsByUserId(user.id);

  const tokenPayload = {
    id: user.id,
    email: user.email,
    roles: user.roles,
    permissions,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ id: user.id });

  await userRepository.updateRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      permissions,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired refresh token!");
  }

  const user = await userRepository.findByIdWithToken(decoded.id);
  if (!user) {
    throw new UnauthorizedError("User no longer exists!");
  }

  if (!user.refresh_token || user.refresh_token !== token) {
    throw new UnauthorizedError("Invalid or revoked refresh token!");
  }

  const permissions = await userRepository.findPermissionsByUserId(user.id);

  const tokenPayload = {
    id: user.id,
    email: user.email,
    roles: user.roles,
    permissions,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken({ id: user.id });

  await userRepository.updateRefreshToken(user.id, newRefreshToken);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (userId, token) => {
  if (userId) {
    await userRepository.updateRefreshToken(userId, null);
    return true;
  }

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      if (decoded?.id) {
        await userRepository.updateRefreshToken(decoded.id, null);
        return true;
      }
    } catch {
      // Ignore token verification errors during logout
    }

    const user = await userRepository.findByRefreshToken(token);
    if (user) {
      await userRepository.updateRefreshToken(user.id, null);
      return true;
    }
  }

  return true;
};

export const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User does not exist on the system!");
  }
  const permissions = await userRepository.findPermissionsByUserId(userId);
  return {
    ...user,
    permissions,
  };
};
