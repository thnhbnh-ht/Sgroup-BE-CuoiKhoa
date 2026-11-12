import catchAsync from "../utils/catchAsync.js";
import * as uploadService from "../service/upload.service.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const uploadFile = catchAsync(async (req, res) => {
  const result = await uploadService.uploadFile(req.file, req.user.id);
  return sendSuccess(res, 201, "Tải file lên thành công!", result);
});

export const getUploadById = catchAsync(async (req, res) => {
  const result = await uploadService.getUploadById(req.params.id);
  return sendSuccess(res, 200, "Lấy thông tin file thành công!", result);
});

export const getMyUploads = catchAsync(async (req, res) => {
  const result = await uploadService.getMyUploads(req.user.id);
  return sendSuccess(res, 200, "Lấy danh sách file đã tải lên thành công!", result);
});

