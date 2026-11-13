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

    const error = new BadRequestError("Invalid input data!");
    error.errors = formattedErrors;

    return next(error);
  };
};

const validateAllowedUpdateFields = (allowedFields, entityName) => {
  return body().custom((value, { req }) => {
    const keys = Object.keys(req.body || {});

    if (keys.length === 0) {
      throw new Error(
        `At least one field must be provided to update ${entityName}`,
      );
    }

    const invalidFields = keys.filter((key) => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
      throw new Error(
        `Invalid fields: ${invalidFields.join(", ")}. Allowed fields: ${allowedFields.join(", ")}`,
      );
    }

    return true;
  });
};

const createIdParamRule = (paramName, label) => [
  param(paramName)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isInt({ min: 1 })
    .withMessage(`${label} must be a positive integer`),
];

export const userIdParamRules = createIdParamRule("id", "User ID");
export const classIdParamRules = createIdParamRule("id", "Class ID");
export const memberIdParamRules = createIdParamRule("memberId", "Member ID");
export const lessonIdParamRules = createIdParamRule("id", "Lesson ID");
export const assignmentIdParamRules = createIdParamRule("id", "Assignment ID");
export const submissionIdParamRules = createIdParamRule("id", "Submission ID");

export const registerRules = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .bail()
    .matches(/^[\p{L}\p{M}\s.'-]+$/u)
    .withMessage(
      "Name can only contain letters, spaces, dots, apostrophes, and hyphens",
    ),

  body("email")
    .isString()
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email format")
    .bail()
    .isLength({ max: 254 })
    .withMessage("Email must not exceed 254 characters")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least 1 uppercase letter")
    .bail()
    .matches(/[a-z]/)
    .withMessage("Password must contain at least 1 lowercase letter")
    .bail()
    .matches(/[0-9]/)
    .withMessage("Password must contain at least 1 number")
    .bail()
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least 1 special character"),
];

export const loginRules = [
  body("email")
    .isString()
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .bail()
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

export const createUserRules = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .bail()
    .matches(/^[\p{L}\p{M}\s.'-]+$/u)
    .withMessage(
      "Name can only contain letters, spaces, dots, apostrophes, and hyphens",
    ),

  body("email")
    .isString()
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email format")
    .bail()
    .isLength({ max: 254 })
    .withMessage("Email must not exceed 254 characters")
    .normalizeEmail(),
];

export const updateUserRules = [
  validateAllowedUpdateFields(["name", "email"], "user"),

  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .bail()
    .matches(/^[\p{L}\p{M}\s.'-]+$/u)
    .withMessage(
      "Name can only contain letters, spaces, dots, apostrophes, and hyphens",
    ),

  body("email")
    .optional()
    .isString()
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email format")
    .bail()
    .isLength({ max: 254 })
    .withMessage("Email must not exceed 254 characters")
    .normalizeEmail(),
];

export const createClassRules = [
  body("name")
    .isString()
    .withMessage("Class name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Class name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Class name must be between 2 and 100 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date"),

  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("End date must be a valid ISO8601 date")
    .bail()
    .custom((endDate, { req }) => {
      if (
        req.body?.startDate &&
        new Date(endDate) <= new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("mentorId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Mentor ID must be a positive integer"),
];

export const updateClassRules = [
  validateAllowedUpdateFields(
    ["name", "description", "startDate", "endDate", "mentorId"],
    "class",
  ),

  body("name")
    .optional()
    .isString()
    .withMessage("Class name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Class name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Class name must be between 2 and 100 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date"),

  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("End date must be a valid ISO8601 date")
    .bail()
    .custom((endDate, { req }) => {
      if (
        req.body?.startDate &&
        new Date(endDate) <= new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("mentorId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Mentor ID must be a positive integer"),
];

export const addClassMemberRules = [
  body("memberId")
    .notEmpty()
    .withMessage("Member ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Member ID must be a positive integer"),
];

export const assignMentorRules = [
  body("mentorId")
    .notEmpty()
    .withMessage("Mentor ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Mentor ID must be a positive integer"),
];

export const createLessonRules = [
  body("title")
    .isString()
    .withMessage("Lesson title must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Lesson title is required")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Lesson title must be between 2 and 200 characters"),

  body("content")
    .isString()
    .withMessage("Lesson content must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Lesson content is required")
    .bail()
    .isLength({ max: 50000 })
    .withMessage("Lesson content must not exceed 50000 characters"),

  body("lessonOrder")
    .notEmpty()
    .withMessage("Lesson order is required")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Lesson order must be a non-negative integer (>= 0)"),
];

export const updateLessonRules = [
  validateAllowedUpdateFields(["title", "content", "lessonOrder"], "lesson"),

  body("title")
    .optional()
    .isString()
    .withMessage("Lesson title must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Lesson title is required")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Lesson title must be between 2 and 200 characters"),

  body("content")
    .optional()
    .isString()
    .withMessage("Lesson content must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Lesson content is required")
    .bail()
    .isLength({ max: 50000 })
    .withMessage("Lesson content must not exceed 50000 characters"),

  body("lessonOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Lesson order must be a non-negative integer (>= 0)"),
];

export const createAssignmentRules = [
  body("title")
    .isString()
    .withMessage("Assignment title must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Assignment title is required")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Assignment title must be between 2 and 200 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Assignment description must be a string")
    .bail()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Assignment description must not exceed 5000 characters"),

  body("deadline")
    .notEmpty()
    .withMessage("Deadline is required")
    .bail()
    .isISO8601()
    .withMessage("Deadline must be a valid ISO8601 date"),

  body("maximumScore")
    .notEmpty()
    .withMessage("Maximum score is required")
    .bail()
    .isInt({ min: 1, max: 100 })
    .withMessage("Maximum score must be an integer between 1 and 100"),
];

export const updateAssignmentRules = [
  validateAllowedUpdateFields(
    ["title", "description", "deadline", "maximumScore"],
    "assignment",
  ),

  body("title")
    .optional()
    .isString()
    .withMessage("Assignment title must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Assignment title is required")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Assignment title must be between 2 and 200 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Assignment description must be a string")
    .bail()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Assignment description must not exceed 5000 characters"),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid ISO8601 date"),

  body("maximumScore")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Maximum score must be an integer between 1 and 100"),
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
        typeof req.body[key] === "string" &&
        req.body[key].trim() !== "",
    );

    if (!hasAllowedField) {
      throw new Error(
        "Must provide at least content, repositoryUrl, or an attached file",
      );
    }

    return true;
  }),

  body("content")
    .optional({ nullable: true })
    .isString()
    .withMessage("Submission content must be a string")
    .bail()
    .trim()
    .isLength({ max: 10000 })
    .withMessage("Submission content must not exceed 10000 characters"),

  body("repositoryUrl")
    .optional({ nullable: true })
    .isString()
    .withMessage("Repository link must be a string")
    .bail()
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage(
      "Repository link must be a valid URL starting with http:// or https://",
    )
    .bail()
    .isLength({ max: 500 })
    .withMessage("Repository link must not exceed 500 characters"),
];

export const reviewSubmissionRules = [
  body("score")
    .notEmpty()
    .withMessage("Score is required")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Score must be a non-negative integer (>= 0)"),

  body("feedback")
    .optional({ nullable: true })
    .isString()
    .withMessage("Feedback must be a string")
    .bail()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Feedback must not exceed 2000 characters"),
];
