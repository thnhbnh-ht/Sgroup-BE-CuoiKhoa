import * as authService from "../service/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";
import { config } from "../config/env.config.js";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.app.nodeEnv === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const register = catchAsync(async (req, res) => {
  const newUser = await authService.register(req.body);
  return sendSuccess(res, 201, "Account registered successfully!", newUser);
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);

  res.cookie("refreshToken", result.refreshToken, getCookieOptions());

  const { refreshToken, ...responsePayload } = result;

  return sendSuccess(res, 200, "Logged in successfully!", responsePayload);
});

export const logout = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const token =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.body?.refresh_token;

  await authService.logout(userId, token);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.app.nodeEnv === "production",
    sameSite: "strict",
  });

  return sendSuccess(res, 200, "Logged out successfully!", null);
});

export const refreshToken = catchAsync(async (req, res) => {
  const token =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.body?.refresh_token;

  const result = await authService.refreshToken(token);

  res.cookie("refreshToken", result.refreshToken, getCookieOptions());

  return sendSuccess(res, 200, "Token refreshed successfully!", {
    accessToken: result.accessToken,
  });
});

export const getMe = catchAsync(async (req, res) => {
  const currentUserId = req.user.id;
  const userProfile = await authService.getMe(currentUserId);
  return sendSuccess(res, 200, "Fetched profile successfully!", userProfile);
});
