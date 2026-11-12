import catchAsync from "../utils/catchAsync.js";
import * as submissionService from "../service/submission.service.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getMySubmissions = catchAsync(async (req, res) => {
  const { page, limit, classId, status } = req.query;
  const result = await submissionService.getSubmissionsByMemberId(
    req.user.id,
    { page, limit, classId, status },
  );

  return sendSuccess(
    res,
    200,
    "Fetched submissions successfully!",
    result,
  );
});

export const getSubmissionById = catchAsync(async (req, res) => {
  const submission = await submissionService.getSubmissionById(
    req.params.id,
    req.user,
  );

  return sendSuccess(res, 200, "Fetched submission details successfully!", submission);
});

export const submitAssignment = catchAsync(async (req, res) => {
  const submission = await submissionService.submitAssignment(
    req.params.id,
    req.body,
    req.user,
    req.file,
  );

  return sendSuccess(res, 201, "Assignment submitted successfully!", submission);
});

export const getSubmissionsByAssignmentId = catchAsync(async (req, res) => {
  const { page, limit, status, search } = req.query;
  const result = await submissionService.getSubmissionsByAssignmentId(
    req.params.id,
    req.user,
    { page, limit, status, search },
  );

  return sendSuccess(
    res,
    200,
    "Fetched assignment submissions successfully!",
    result,
  );
});

export const getMySubmissionByAssignment = catchAsync(async (req, res) => {
  const submission = await submissionService.getMySubmissionByAssignment(
    req.params.id,
    req.user,
  );

  return sendSuccess(res, 200, "Fetched your submission successfully!", submission);
});

export const reviewSubmission = catchAsync(async (req, res) => {
  const submission = await submissionService.reviewSubmission(
    req.params.id,
    req.body,
    req.user,
  );

  return sendSuccess(res, 200, "Submission reviewed successfully!", submission);
});