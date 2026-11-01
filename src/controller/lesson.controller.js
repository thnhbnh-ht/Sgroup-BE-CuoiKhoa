import * as lessonService from "../service/lesson.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getLessonsByClassId = catchAsync(async (req, res) => {
  const lessons = await lessonService.getLessonsByClassId(
    req.params.id,
    req.user,
  );
  return sendSuccess(res, 200, "Lấy danh sách lesson thành công!", lessons);
});

export const getLessonById = catchAsync(async (req, res) => {
  const lesson = await lessonService.getLessonById(req.params.id, req.user);
  return sendSuccess(res, 200, "Lấy dữ liệu lesson thành công", lesson);
});

export const createLesson = catchAsync(async (req, res) => {
  const lesson = await lessonService.createLesson(
    {
      ...req.body,
      classId: req.params.id,
    },
    req.user,
  );
  return sendSuccess(res, 201, "Tạo lesson thành công!", lesson);
});

export const updateLesson = catchAsync(async (req, res) => {
  const lesson = await lessonService.updateLesson(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, 200, "Cập nhật lesson thành công!", lesson);
});

export const deleteLesson = catchAsync(async (req, res) => {
  const lesson = await lessonService.deleteLesson(req.params.id, req.user);
  return sendSuccess(res, 200, "Xóa lesson thành công!", lesson);
});

export const completeLesson = catchAsync(async (req, res) => {
  const progress = await lessonService.completeLesson(req.params.id, req.user);
  return sendSuccess(res, 200, "Hoàn thành lesson thành công!", progress);
});

export const getClassProgress = catchAsync(async (req, res) => {
  const progressData = await lessonService.getClassProgress(
    req.params.id,
    req.user,
  );
  return sendSuccess(res, 200, "Lấy tiến độ lesson thành công!", progressData);
});