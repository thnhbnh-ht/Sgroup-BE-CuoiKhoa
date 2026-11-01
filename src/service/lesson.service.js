import * as lessonRepository from "../repository/lesson.repository.js";
import * as classRepository from "../repository/class.repository.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../core/error.response.js";

const getAuthInfo = (requestingUser) => {
  const roles = requestingUser?.roles || [];
  const id = Number(requestingUser?.id || requestingUser || 0);
  return { roles, id };
};

export const getLessonsByClassId = async (classId, requestingUser) => {
  const classData = await classRepository.findById(classId);

  if (!classData) {
    throw new NotFoundError("Lớp này không tồn tại!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);
  const isAdmin = roles.includes("ADMIN");
  const isMentor = Number(classData.mentor_id) === userId;
  const isMember = await classRepository.isMemberOfClass(classId, userId);

  if (!isAdmin && !isMentor && !isMember) {
    throw new ForbiddenError("Bạn không có quyền xem bài học của lớp này!");
  }

  return await lessonRepository.findAllByClassId(classId);
};

export const getLessonById = async (id, requestingUser) => {
  const lesson = await lessonRepository.findById(id);

  if (!lesson) {
    throw new NotFoundError("Bài học không tồn tại!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (roles.includes("ADMIN")) {
    return lesson;
  }

  const isMember = await classRepository.isMemberOfClass(
    lesson.class_id,
    userId
  );
  const isMentor = await classRepository.isMentorOfClass(
    lesson.class_id,
    userId
  );

  if (!isMember && !isMentor) {
    throw new ForbiddenError("Bạn không có quyền xem bài học này!");
  }

  return lesson;
};

export const createLesson = async (data, requestingUser) => {
  const classData = await classRepository.findById(data.classId);

  if (!classData) {
    throw new NotFoundError("Lớp không tồn tại!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (!roles.includes("ADMIN")) {
    const isMentor = await classRepository.isMentorOfClass(
      data.classId,
      userId
    );

    if (!isMentor) {
      throw new ForbiddenError("Bạn không có quyền tạo bài học của lớp này!");
    }
  }

  return await lessonRepository.create({
    classId: Number(data.classId),
    title: data.title,
    content: data.content,
    lessonOrder: data.lessonOrder ? Number(data.lessonOrder) : 0,
    createdBy: userId,
  });
};

export const updateLesson = async (id, data, requestingUser) => {
  const lesson = await lessonRepository.findById(id);

  if (!lesson) {
    throw new NotFoundError("Bài học này không tồn tại!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (!roles.includes("ADMIN")) {
    const isMentor = await classRepository.isMentorOfClass(
      lesson.class_id,
      userId
    );

    if (!isMentor) {
      throw new ForbiddenError("Bạn không có quyền cập nhật bài học này!");
    }
  }

  return await lessonRepository.update(id, data);
};

export const deleteLesson = async (id, requestingUser) => {
  const lesson = await lessonRepository.findById(id);

  if (!lesson) {
    throw new NotFoundError("Bài học này không tồn tại!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (!roles.includes("ADMIN")) {
    const isMentor = await classRepository.isMentorOfClass(
      lesson.class_id,
      userId
    );

    if (!isMentor) {
      throw new ForbiddenError("Bạn không có quyền xóa bài học này!");
    }
  }

  return await lessonRepository.deleteById(id);
};

export const completeLesson = async (lessonId, requestingUser) => {
  const lesson = await lessonRepository.findById(lessonId);

  if (!lesson) {
    throw new NotFoundError("Bài học này không tồn tại!");
  }

  const { id: userId } = getAuthInfo(requestingUser);
  const isMember = await classRepository.isMemberOfClass(
    lesson.class_id,
    userId
  );

  if (!isMember) {
    throw new ForbiddenError("Bạn không phải thành viên của lớp này!");
  }

  const progress = await lessonRepository.findProgress(
    lessonId,
    userId
  );

  if (progress) {
    throw new ConflictError("Bạn đã hoàn thành bài học này!");
  }

  return await lessonRepository.completeLesson(lessonId, userId);
};

export const getClassProgress = async (classId, requestingUser) => {
  const classData = await classRepository.findById(classId);
  if (!classData) {
    throw new NotFoundError("Class không tồn tại!");
  }

  const userId = Number(requestingUser?.id || requestingUser?.userId || 0);
  const roles = requestingUser?.roles || (requestingUser?.role ? [requestingUser.role] : []);

  const isAdmin = roles.includes("ADMIN");
  const isMentor = Number(classData.mentor_id) === userId;
  const isMember = userId > 0 ? await classRepository.isMemberOfClass(classId, userId) : false;

  if (!isAdmin && !isMentor && !isMember) {
    throw new ForbiddenError("Bạn không có quyền xem tiến độ của lớp này!");
  }

  const targetUserId = userId > 0 ? userId : 0;

  const { totalLessons, completedLessons } = await lessonRepository.getClassProgress(classId, targetUserId);

  const total = Number(totalLessons) || 0;
  const completed = Number(completedLessons) || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    totalLessons: total,
    completedLessons: completed,
    progress,
  };
};