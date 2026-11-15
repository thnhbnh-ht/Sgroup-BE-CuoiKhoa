import jwt from "jsonwebtoken";
import crypto from "crypto";

import { config } from "../config/env.config.js";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      jti: crypto.randomUUID(),
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
    },
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};