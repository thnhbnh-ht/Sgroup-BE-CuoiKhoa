import dotenv from "dotenv";

dotenv.config();

const env = process.env;

export const config = {
  app: {
    port: Number(env.PORT),
    nodeEnv: env.NODE_ENV,
  },

  db: {
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  r2: {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
    endpoint: env.R2_ENDPOINT,
    publicBaseUrl: env.R2_PUBLIC_BASE_URL,
    maxFileSize: Number(env.UPLOAD_MAX_FILE_SIZE),
  },
};
