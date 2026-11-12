import { validationResult, body, param } from "express-validator";
import { BadRequestError } from "../core/error.response.js";

export const validate = (rules) => {
  return async (req, res, next) => {
    await Promise.all(rules.map((rule) => rule.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    const error = new BadRequestError("Invalid data!");
    error.errors = formattedErrors;

    return next(error);
  };
};

export const userIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("User ID is required")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),
];

export const createUserRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("User name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("User name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
];

export const updateUserRules = [
  body().custom((value, { req }) => {
    const allowedFields = ["name", "email"];

    const hasAllowedField = Object.keys(req.body).some((key) =>
      allowedFields.includes(key),
    );

    if (!hasAllowedField) {
      throw new Error(
        "Must provide at least one field to update: name or email",
      );
    }

    return true;
  }),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("User name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("User name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
];

export const registerRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required"),
];

export const refreshTokenRules = [
  body().custom((value, { req }) => {
    const token = req.body?.refreshToken || req.body?.refresh_token;
    if (!token || typeof token !== "string" || token.trim() === "") {
      throw new Error("Refresh token is required");
    }
    return true;
  }),
];

export const classIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Class ID is required")
    .isInt({ min: 1 })
    .withMessage("Class ID must be a positive integer"),
];

export const createClassRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Class name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Class name must be between 2 and 100 characters"),

  body("description").optional().trim(),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date format"),

  body("mentorId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Mentor ID must be a positive integer"),
];

export const updateClassRules = [
  body().custom((value, { req }) => {
    const allowedFields = [
      "name",
      "description",
      "startDate",
      "endDate",
      "mentorId",
    ];

    const hasAllowedField = Object.keys(req.body).some((key) =>
      allowedFields.includes(key),
    );

    if (!hasAllowedField) {
      throw new Error("Must provide at least one field to update class");
    }

    return true;
  }),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Class name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Class name must be between 2 and 100 characters"),

  body("description").optional().trim(),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date format"),

  body("mentorId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Mentor ID must be a positive integer"),
];

export const memberIdParamRules = [
  param("memberId")
    .trim()
    .notEmpty()
    .withMessage("Member ID is required")
    .isInt({ min: 1 })
    .withMessage("Member ID must be a positive integer"),
];

export const addClassMemberRules = [
  body("memberId")
    .notEmpty()
    .withMessage("Member ID is required")
    .isInt({ min: 1 })
    .withMessage("Member ID must be a positive integer"),
];

export const assignMentorRules = [
  body("mentorId")
    .notEmpty()
    .withMessage("Mentor ID is required")
    .isInt({ min: 1 })
    .withMessage("Mentor ID must be a positive integer"),
];

export const createLessonRules = [
  body("title")
    .notEmpty()
    .withMessage("Lesson title is required")
    .isString()
    .withMessage("Lesson title must be a string"),

  body("content")
    .notEmpty()
    .withMessage("Lesson content is required")
    .isString()
    .withMessage("Lesson content must be a string"),

  body("lessonOrder")
    .notEmpty()
    .withMessage("Lesson order is required")
    .isInt({ min: 0 })
    .withMessage("Lesson order must be an integer >= 0"),
];

export const lessonIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Lesson ID is required")
    .isInt({ min: 1 })
    .withMessage("Lesson ID must be a positive integer"),
];

export const updateLessonRules = [
  body().custom((value, { req }) => {
    const allowedFields = ["title", "content", "lessonOrder"];

    const hasAllowedField = Object.keys(req.body).some((key) =>
      allowedFields.includes(key),
    );

    if (!hasAllowedField) {
      throw new Error("Must provide at least one field to update lesson");
    }

    return true;
  }),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Lesson title is required")
    .isString()
    .withMessage("Lesson title must be a string"),

  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Lesson content is required")
    .isString()
    .withMessage("Lesson content must be a string"),

  body("lessonOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Lesson order must be an integer >= 0"),
];

export const assignmentIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Assignment ID is required")
    .isInt({ min: 1 })
    .withMessage("Assignment ID must be a positive integer"),
];

export const createAssignmentRules = [
  body("title")
    .notEmpty()
    .withMessage("Assignment title is required")
    .isString()
    .withMessage("Assignment title must be a string"),

  body("description")
    .optional()
    .isString()
    .withMessage("Assignment description must be a string"),

  body("deadline")
    .notEmpty()
    .withMessage("Deadline is required")
    .isISO8601()
    .withMessage("Deadline must be a valid date format"),

  body("maximumScore")
    .notEmpty()
    .withMessage("Maximum score is required")
    .isFloat({ min: 0.01 })
    .withMessage("Maximum score must be greater than 0"),
];

export const updateAssignmentRules = [
  body().custom((value, { req }) => {
    const allowedFields = ["title", "description", "deadline", "maximumScore"];

    const hasAllowedField = Object.keys(req.body).some((key) =>
      allowedFields.includes(key),
    );

    if (!hasAllowedField) {
      throw new Error(
        "Must provide at least one field to update assignment",
      );
    }

    return true;
  }),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Assignment title is required")
    .isString()
    .withMessage("Assignment title must be a string"),

  body("description")
    .optional()
    .isString()
    .withMessage("Assignment description must be a string"),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid date format"),

  body("maximumScore")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Maximum score must be greater than 0"),
];

export const submissionIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Submission ID is required")
    .isInt({ min: 1 })
    .withMessage("Submission ID must be a positive integer"),
];

export const submitAssignmentRules = [
  body().custom((value, { req }) => {
    if (req.file) {
      return true;
    }

    const allowedFields = ["content", "repositoryUrl"];

    const hasAllowedField = Object.keys(req.body || {}).some(
      (key) =>
        allowedFields.includes(key) &&
        req.body[key] !== undefined &&
        String(req.body[key]).trim() !== "",
    );

    if (!hasAllowedField) {
      throw new Error(
        "Must provide at least content, repositoryUrl, or file",
      );
    }

    return true;
  }),

  body("content")
    .optional()
    .trim()
    .isString()
    .withMessage("Submission content must be a string"),

  body("repositoryUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Repository link must be a valid URL"),
];

export const reviewSubmissionRules = [
  body("score")
    .notEmpty()
    .withMessage("Score is required")
    .isFloat({ min: 0 })
    .withMessage("Score must be greater than or equal to 0"),

  body("feedback")
    .optional()
    .trim()
    .isString()
    .withMessage("Feedback must be a string"),
];