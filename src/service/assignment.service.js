import * as assignmentRepository from "../repository/assignment.repository.js";
import * as classRepository from "../repository/class.repository.js";
import {
  NotFoundError,
  ForbiddenError,
} from "../core/error.response.js";

const getAuthInfo = (requestingUser) => {
  const roles = requestingUser?.roles || [];
  const id = Number(requestingUser?.id || requestingUser || 0);
  return { roles, id };
};

export const getAssignmentsByClassId = async (classId, requestingUser) => {
  const classData = await classRepository.findById(classId);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);
  const isAdmin = roles.includes("ADMIN");
  const isMentor = Number(classData.mentor_id) === userId;
  const isMember = await classRepository.isMemberOfClass(classId, userId);

  if (!isAdmin && !isMentor && !isMember) {
    throw new ForbiddenError("You do not have permission to view assignments of this class!");
  }

  return await assignmentRepository.findAllByClassId(classId);
};

export const getAssignmentById = async (id, requestingUser) => {
  const assignment = await assignmentRepository.findById(id);

  if (!assignment) {
    throw new NotFoundError("Assignment does not exist!");
  }

  const classData = await classRepository.findById(assignment.class_id);
  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (roles.includes("ADMIN")) {
    return assignment;
  }

  const isMember = await classRepository.isMemberOfClass(assignment.class_id, userId);
  const isMentor = Number(classData.mentor_id) === userId;

  if (!isMember && !isMentor) {
    throw new ForbiddenError("You do not have permission to view this assignment!");
  }

  return assignment;
};

export const createAssignment = async (classId, data, requestingUser) => {
  const classData = await classRepository.findById(classId);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (!roles.includes("ADMIN")) {
    const isMentor = Number(classData.mentor_id) === userId;
    if (!isMentor) {
      throw new ForbiddenError("You do not have permission to create assignments for this class!");
    }
  }

  return await assignmentRepository.create({
    classId: Number(classId),
    title: data.title,
    description: data.description,
    deadline: data.deadline,
    maximumScore: data.maximumScore ? Number(data.maximumScore) : 100,
    createdBy: userId,
  });
};

export const updateAssignment = async (id, data, requestingUser) => {
  const assignment = await assignmentRepository.findById(id);

  if (!assignment) {
    throw new NotFoundError("This assignment does not exist!");
  }

  const classData = await classRepository.findById(assignment.class_id);
  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (!roles.includes("ADMIN")) {
    const isMentor = Number(classData.mentor_id) === userId;
    if (!isMentor) {
      throw new ForbiddenError("You do not have permission to update this assignment!");
    }
  }

  return await assignmentRepository.update(id, data);
};

export const deleteAssignment = async (id, requestingUser) => {
  const assignment = await assignmentRepository.findById(id);

  if (!assignment) {
    throw new NotFoundError("This assignment does not exist!");
  }

  const classData = await classRepository.findById(assignment.class_id);
  const { roles, id: userId } = getAuthInfo(requestingUser);

  if (!roles.includes("ADMIN")) {
    const isMentor = Number(classData.mentor_id) === userId;
    if (!isMentor) {
      throw new ForbiddenError("You do not have permission to delete this assignment!");
    }
  }

  return await assignmentRepository.deleteById(id);
};