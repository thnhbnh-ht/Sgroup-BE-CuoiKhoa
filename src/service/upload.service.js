import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { config } from "../config/env.config.js";
import * as uploadRepository from "../repository/upload.repository.js";
import { BadRequestError, NotFoundError } from "../core/error.response.js";

const r2Client = new S3Client({
  region: "auto",
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId || "",
    secretAccessKey: config.r2.secretAccessKey || "",
  },
});

const sanitizeFileName = (fileName) => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
};

export const uploadFile = async (file, userId) => {
  if (!file) {
    throw new BadRequestError("Vui lòng chọn file để tải lên!");
  }

  const safeName = sanitizeFileName(file.originalname || "file");
  const objectKey = `submissions/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2Client.send(command);

  const baseUrl = (config.r2.publicBaseUrl || "").replace(/\/$/, "");
  const publicUrl = baseUrl ? `${baseUrl}/${objectKey}` : objectKey;

  const uploadRecord = await uploadRepository.create({
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    objectKey,
    url: publicUrl,
    uploadedBy: userId,
  });

  return uploadRecord;
};

export const getUploadById = async (id) => {
  const upload = await uploadRepository.findById(id);
  if (!upload) {
    throw new NotFoundError("File không tồn tại!");
  }
  return upload;
};

export const getMyUploads = async (userId) => {
  return await uploadRepository.findAllByUserId(userId);
};

