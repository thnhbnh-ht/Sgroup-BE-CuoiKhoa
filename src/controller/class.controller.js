import * as classService from "../service/class.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getAllClasses = catchAsync(async (req, res) => {
  const classes = await classService.getAllClasses(req.user);

  return sendSuccess(res, 200, "Lấy danh sách class thành công", classes);
});

export const getClassById = catchAsync(async (req, res) => {
  const classData = await classService.getClassById(req.params.id, req.user);

  return sendSuccess(res, 200, "Lấy thông tin class thành công", classData);
});

export const createClass = catchAsync(async (req, res) => {
  const newClass = await classService.createClass(req.body, req.user);

  return sendSuccess(res, 201, "Tạo class thành công", newClass);
});

export const updateClass = catchAsync(async (req, res) => {
  const updatedClass = await classService.updateClass(req.params.id, req.body);

  return sendSuccess(res, 200, "Cập nhật class thành công", updatedClass);
});

export const deleteClass = catchAsync(async (req, res) => {
  const deletedClass = await classService.deleteClass(req.params.id);

  return sendSuccess(res, 200, "Xóa class thành công", deletedClass);
});

export const getClassMembers = catchAsync(async (req, res) => {
  const members = await classService.getClassMembers(req.params.id);

  return sendSuccess(res, 200, "Lấy danh sách thành viên thành công", members);
});

export const addClassMember = catchAsync(async (req, res) => {
  const member = await classService.addClassMember(
    req.params.id,
    req.body.memberId,
  );

  return sendSuccess(res, 201, "Thêm thành viên vào class thành công", member);
});

export const removeClassMember = catchAsync(async (req, res) => {
  const member = await classService.removeClassMember(
    req.params.id,
    req.params.memberId,
  );

  return sendSuccess(res, 200, "Xóa thành viên khỏi class thành công", member);
});

export const assignMentor = catchAsync(async (req, res) => {
  const classData = await classService.assignMentor(
    req.params.id,
    req.body.mentorId,
  );

  return sendSuccess(res, 200, "Gán mentor cho class thành công", classData);
});
