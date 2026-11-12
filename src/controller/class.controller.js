import * as classService from "../service/class.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getAllClasses = catchAsync(async (req, res) => {
  const classes = await classService.getAllClasses(req.user);

  return sendSuccess(res, 200, "Fetched classes successfully!", classes);
});

export const getClassById = catchAsync(async (req, res) => {
  const classData = await classService.getClassById(req.params.id, req.user);

  return sendSuccess(res, 200, "Fetched class details successfully!", classData);
});

export const createClass = catchAsync(async (req, res) => {
  const newClass = await classService.createClass(req.body, req.user);

  return sendSuccess(res, 201, "Class created successfully!", newClass);
});

export const updateClass = catchAsync(async (req, res) => {
  const updatedClass = await classService.updateClass(req.params.id, req.body);

  return sendSuccess(res, 200, "Class updated successfully!", updatedClass);
});

export const deleteClass = catchAsync(async (req, res) => {
  const deletedClass = await classService.deleteClass(req.params.id);

  return sendSuccess(res, 200, "Class deleted successfully!", deletedClass);
});

export const getMembersOfClass = catchAsync(async (req, res) => {
  const members = await classService.getMembersOfClass(req.params.id);

  return sendSuccess(res, 200, "Fetched class members successfully!", members);
});

export const addClassMember = catchAsync(async (req, res) => {
  const member = await classService.addClassMember(
    req.params.id,
    req.body.memberId,
  );

  return sendSuccess(res, 201, "Member added to class successfully!", member);
});

export const removeClassMember = catchAsync(async (req, res) => {
  const member = await classService.removeClassMember(
    req.params.id,
    req.params.memberId,
  );

  return sendSuccess(res, 200, "Member removed from class successfully!", member);
});

export const assignMentor = catchAsync(async (req, res) => {
  const classData = await classService.assignMentor(
    req.params.id,
    req.body.mentorId,
  );

  return sendSuccess(res, 200, "Mentor assigned to class successfully!", classData);
});