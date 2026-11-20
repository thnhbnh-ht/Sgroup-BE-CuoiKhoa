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

    if (req.file) {
      req.uploadedFileList = [req.file];
    }

    return next();
  });
};

export const uploadFiles = (req, res, next) => {
  const multiUpload = upload.fields([
    { name: "file", maxCount: 1 },
    { name: "files", maxCount: 10 },
  ]);

  multiUpload(req, res, (err) => {
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

    const fileList = [];
    if (req.files?.file) fileList.push(...req.files.file);
    if (req.files?.files) fileList.push(...req.files.files);

    req.uploadedFileList = fileList;
    req.file = fileList[0] || null; // backward compatibility

    return next();
  });
};