import multer from "multer";
import { config } from "../config/env.config.js";
import { BadRequestError } from "../core/error.response.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.r2.maxFileSize,
  },
});

export const uploadSingle = (req, res, next) => {
  const singleUpload = upload.single("file");

  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const maxMB = Math.round(config.r2.maxFileSize / (1024 * 1024));
        return next(
          new BadRequestError(
            `File size exceeds the allowed limit (${maxMB}MB)!`,
          ),
        );
      }
      return next(new BadRequestError(`File upload error: ${err.message}`));
    }

    if (err) {
      return next(err);
    }

    return next();
  });
};