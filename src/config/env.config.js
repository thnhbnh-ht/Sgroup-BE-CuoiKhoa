import dotenv from "dotenv";
dotenv.config();

export const config = {
  app: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "postgres",
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "secret_access_token",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "secret_refresh_token",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    endpoint: process.env.R2_ENDPOINT,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || "10485760", 10),
  },
};
