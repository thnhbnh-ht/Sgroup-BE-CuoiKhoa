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
    throw new NotFoundError("This class does not exist!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);
  const isAdmin = roles.includes("ADMIN");
  const isMentor = Number(classData.mentor_id) === userId;
  const isMember = await classRepository.isMemberOfClass(classId, userId);

  if (!isAdmin && !isMentor && !isMember) {
    throw new ForbiddenError("You do not have permission to view lessons of this class!");
  }

  return await lessonRepository.findAllByClassId(classId);
};

export const getLessonById = async (id, requestingUser) => {
  const lesson = await lessonRepository.findById(id);

  if (!lesson) {
    throw new NotFoundError("Lesson does not exist!");
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
    throw new ForbiddenError("You do not have permission to view this lesson!");
  }

  return lesson;
};

export const createLesson = async (data, requestingUser) => {
  const classData = await classRepository.findById(data.classId);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (!roles.includes("ADMIN")) {
    const isMentor = await classRepository.isMentorOfClass(
      data.classId,
      userId
    );

    if (!isMentor) {
      throw new ForbiddenError("You do not have permission to create lessons for this class!");
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
    throw new NotFoundError("This lesson does not exist!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (!roles.includes("ADMIN")) {
    const isMentor = await classRepository.isMentorOfClass(
      lesson.class_id,
      userId
    );

    if (!isMentor) {
      throw new ForbiddenError("You do not have permission to update this lesson!");
    }
  }

  return await lessonRepository.update(id, data);
};

export const deleteLesson = async (id, requestingUser) => {
  const lesson = await lessonRepository.findById(id);

  if (!lesson) {
    throw new NotFoundError("This lesson does not exist!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (!roles.includes("ADMIN")) {
    const isMentor = await classRepository.isMentorOfClass(
      lesson.class_id,
      userId
    );

    if (!isMentor) {
      throw new ForbiddenError("You do not have permission to delete this lesson!");
    }
  }

  return await lessonRepository.deleteById(id);
};

export const completeLesson = async (lessonId, requestingUser) => {
  const lesson = await lessonRepository.findById(lessonId);

  if (!lesson) {
    throw new NotFoundError("This lesson does not exist!");
  }

  const { id: userId } = getAuthInfo(requestingUser);
  const isMember = await classRepository.isMemberOfClass(
    lesson.class_id,
    userId
  );

  if (!isMember) {
    throw new ForbiddenError("You are not a member of this class!");
  }

  const progress = await lessonRepository.findProgress(
    lessonId,
    userId
  );

  if (progress) {
    throw new ConflictError("You have already completed this lesson!");
  }

  return await lessonRepository.completeLesson(lessonId, userId);
};

export const getClassProgress = async (classId, requestingUser) => {
  const classData = await classRepository.findById(classId);
  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  const userId = Number(requestingUser?.id || requestingUser?.userId || 0);
  const roles = requestingUser?.roles || (requestingUser?.role ? [requestingUser.role] : []);

  const isAdmin = roles.includes("ADMIN");
  const isMentor = Number(classData.mentor_id) === userId;
  const isMember = userId > 0 ? await classRepository.isMemberOfClass(classId, userId) : false;

  if (!isAdmin && !isMentor && !isMember) {
    throw new ForbiddenError("You do not have permission to view progress of this class!");
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