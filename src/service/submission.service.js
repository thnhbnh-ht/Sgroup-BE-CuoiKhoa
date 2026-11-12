import * as submissionRepository from "../repository/submission.repository.js";
import * as classRepository from "../repository/class.repository.js";
import * as uploadService from "./upload.service.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../core/error.response.js";

export const getSubmissionById = async (id, requestingUser) => {
  const submission = await submissionRepository.findById(id);

  if (!submission) {
    throw new NotFoundError("Bài nộp không tồn tại!");
  }

  if (requestingUser.roles.includes("ADMIN")) {
    return submission;
  }

  const assignment = await submissionRepository.findAssignmentById(
    submission.assignment_id,
  );

  const isMentor = await classRepository.isMentorOfClass(
    assignment.class_id,
    requestingUser.id,
  );

  const isOwner = Number(submission.member_id) === Number(requestingUser.id);

  if (!isMentor && !isOwner) {
    throw new ForbiddenError("Bạn không có quyền xem bài nộp này!");
  }

  return submission;
};

export const getSubmissionsByAssignmentId = async (
  assignmentId,
  requestingUser,
  options = {},
) => {
  const assignment = await submissionRepository.findAssignmentById(assignmentId);

  if (!assignment) {
    throw new NotFoundError("Assignment không tồn tại!");
  }

  if (!requestingUser.roles.includes("ADMIN")) {
    const isMentor = await classRepository.isMentorOfClass(
      assignment.class_id,
      requestingUser.id,
    );

    if (!isMentor) {
      throw new ForbiddenError(
        "Bạn không có quyền xem danh sách bài nộp của assignment này!",
      );
    }
  }

  return await submissionRepository.findAllByAssignmentId(
    assignmentId,
    options,
  );
};

export const getMySubmissionByAssignment = async (
  assignmentId,
  requestingUser,
) => {
  const assignment = await submissionRepository.findAssignmentById(assignmentId);

  if (!assignment) {
    throw new NotFoundError("Assignment không tồn tại!");
  }

  const isMember = await classRepository.isMemberOfClass(
    assignment.class_id,
    requestingUser.id,
  );

  if (!isMember && !requestingUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("Bạn không phải là thành viên của class này!");
  }

  const submission = await submissionRepository.findByAssignmentAndMember(
    assignmentId,
    requestingUser.id,
  );

  if (!submission) {
    throw new NotFoundError("Bạn chưa nộp bài cho assignment này!");
  }

  return submission;
};

export const getSubmissionsByMemberId = async (memberId, options = {}) => {
  return await submissionRepository.findAllByMemberId(memberId, options);
};

export const submitAssignment = async (
  assignmentId,
  data = {},
  requestingUser,
  file = null,
) => {
  const assignment = await submissionRepository.findAssignmentById(assignmentId);

  if (!assignment) {
    throw new NotFoundError("Assignment không tồn tại!");
  }

  const isMember = await classRepository.isMemberOfClass(
    assignment.class_id,
    requestingUser.id,
  );

  if (!isMember) {
    throw new ForbiddenError(
      "Chỉ thành viên của class mới được phép nộp bài tập này!",
    );
  }

  if (assignment.deadline && new Date() > new Date(assignment.deadline)) {
    throw new BadRequestError("Đã quá thời hạn nộp bài tập này!");
  }

  let uploadedFile = null;
  if (file) {
    uploadedFile = await uploadService.uploadFile(file, requestingUser.id);
  }

  const repositoryUrl = data.repositoryUrl || uploadedFile?.url || null;

  const submission = await submissionRepository.upsert({
    assignmentId,
    memberId: requestingUser.id,
    content: data.content,
    repositoryUrl,
  });

  if (uploadedFile) {
    return {
      ...submission,
      attachment: uploadedFile,
    };
  }

  return submission;
};

export const reviewSubmission = async (id, data, requestingUser) => {
  const submission = await submissionRepository.findById(id);

  if (!submission) {
    throw new NotFoundError("Bài nộp không tồn tại!");
  }

  const assignment = await submissionRepository.findAssignmentById(
    submission.assignment_id,
  );

  if (!requestingUser.roles.includes("ADMIN")) {
    const isMentor = await classRepository.isMentorOfClass(
      assignment.class_id,
      requestingUser.id,
    );

    if (!isMentor) {
      throw new ForbiddenError(
        "Bạn không có quyền chấm bài nộp của class này!",
      );
    }
  }

  if (Number(data.score) > Number(assignment.maximum_score)) {
    throw new BadRequestError(
      `Điểm chấm không được vượt quá điểm tối đa (${assignment.maximum_score})!`,
    );
  }

  return await submissionRepository.review(id, {
    score: data.score,
    feedback: data.feedback,
    reviewedBy: requestingUser.id,
  });
};
