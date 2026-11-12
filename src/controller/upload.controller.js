import catchAsync from "../utils/catchAsync.js";
import * as uploadService from "../service/upload.service.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const uploadFile = catchAsync(async (req, res) => {
  const result = await uploadService.uploadFile(req.file, req.user.id);
  return sendSuccess(res, 201, "File uploaded successfully!", result);
});

export const getUploadById = catchAsync(async (req, res) => {
  const result = await uploadService.getUploadById(req.params.id);
  return sendSuccess(res, 200, "Fetched file info successfully!", result);
});

export const getMyUploads = catchAsync(async (req, res) => {
  const result = await uploadService.getMyUploads(req.user.id);
  return sendSuccess(res, 200, "Fetched uploaded files successfully!", result);
});