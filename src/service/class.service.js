import * as classRepository from "../repository/class.repository.js";
import * as userRepository from "../repository/user.repository.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../core/error.response.js";

export const getAllClasses = async (requestingUser) => {
  if (requestingUser.roles.includes("ADMIN")) {
    return await classRepository.findAll();
  }

  return await classRepository.findAllByMemberId(requestingUser.id);
};

export const getClassById = async (id, requestingUser) => {
  const classData = await classRepository.findById(id);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  if (requestingUser.roles.includes("ADMIN")) {
    return classData;
  }

  const isMember = await classRepository.isMemberOfClass(id, requestingUser.id);
  const isMentor = await classRepository.isMentorOfClass(id, requestingUser.id);

  if (!isMember && !isMentor) {
    throw new ForbiddenError("You are not a member of this class!");
  }

  return classData;
};

export const createClass = async (data, requestingUser) => {
  const newClass = await classRepository.create({
    ...data,
    createdBy: requestingUser.id,
  });

  return newClass;
};

export const updateClass = async (id, data) => {
  const classData = await classRepository.findById(id);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  return await classRepository.update(id, data);
};

export const deleteClass = async (id) => {
  const classData = await classRepository.findById(id);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  return await classRepository.deleteById(id);
};

export const getMembersOfClass = async (classId) => {
  const classData = await classRepository.findById(classId);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  return await classRepository.findMembersByClassId(classId);
};

export const addClassMember = async (classId, memberId) => {
  const classData = await classRepository.findById(classId);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  const member = await userRepository.findById(memberId);

  if (!member) {
    throw new NotFoundError("User does not exist!");
  }

  const isMember = await classRepository.isMemberOfClass(classId, memberId);

  if (isMember) {
    throw new ConflictError("User is already a member of the class!");
  }

  return await classRepository.addMember(classId, memberId);
};

export const removeClassMember = async (classId, memberId) => {
  const classData = await classRepository.findById(classId);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  const member = await userRepository.findById(memberId);

  if (!member) {
    throw new NotFoundError("User does not exist!");
  }

  const isMember = await classRepository.isMemberOfClass(classId, memberId);

  if (!isMember) {
    throw new ConflictError("User is not a member of the class!");
  }

  return await classRepository.removeMember(classId, memberId);
};

export const assignMentor = async (classId, mentorId) => {
  const classData = await classRepository.findById(classId);

  if (!classData) {
    throw new NotFoundError("Class does not exist!");
  }

  const mentor = await userRepository.findById(mentorId);

  if (!mentor) {
    throw new NotFoundError("User does not exist!");
  }

  return await classRepository.assignMentor(classId, mentorId);
};