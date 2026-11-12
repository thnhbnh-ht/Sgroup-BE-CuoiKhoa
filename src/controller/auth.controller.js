import * as authService from "../service/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const register = catchAsync(async (req, res) => {
  const newUser = await authService.register(req.body);
  return sendSuccess(res, 201, "Account registered successfully!", newUser);
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, 200, "Logged in successfully!", result);
});

export const logout = catchAsync(async (req, res) => {
  return sendSuccess(res, 200, "Logged out successfully!", null);
});

export const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  return sendSuccess(res, 200, "Token refreshed successfully!", result);
});

export const getMe = catchAsync(async (req, res) => {
  const currentUserId = req.user.id;
  const userProfile = await authService.getMe(currentUserId);
  return sendSuccess(
    res,
    200,
    "Fetched profile successfully!",
    userProfile,
  );
});