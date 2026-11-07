import * as assignmentService from "../service/assignment.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getAssignmentsByClassId = catchAsync(async (req, res) => {
  const assignments = await assignmentService.getAssignmentsByClassId(
    req.params.id,
    req.user,
  );
  return sendSuccess(res, 200, "Lấy danh sách bài tập thành công!", assignments);
});

export const getAssignmentById = catchAsync(async (req, res) => {
  const assignment = await assignmentService.getAssignmentById(
    req.params.id,
    req.user,
  );
  return sendSuccess(res, 200, "Lấy thông tin bài tập thành công!", assignment);
});

export const createAssignment = catchAsync(async (req, res) => {
  const assignment = await assignmentService.createAssignment(
    req.params.id, 
    req.body,      
    req.user,     
  );
  return sendSuccess(res, 201, "Tạo bài tập thành công!", assignment);
});

export const updateAssignment = catchAsync(async (req, res) => {
  const assignment = await assignmentService.updateAssignment(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, 200, "Cập nhật bài tập thành công!", assignment);
});

export const deleteAssignment = catchAsync(async (req, res) => {
  const assignment = await assignmentService.deleteAssignment(
    req.params.id,
    req.user,
  );
  return sendSuccess(res, 200, "Xóa bài tập thành công!", assignment);
});