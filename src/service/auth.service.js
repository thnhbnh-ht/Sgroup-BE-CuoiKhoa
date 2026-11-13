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
  try {
    const decoded = verifyRefreshToken(token);
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError("User no longer exists!");
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = generateAccessToken(tokenPayload);
    return { accessToken };
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired refresh token!");
  }
};

export const logout = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User does not exist!");
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
