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

    const error = new BadRequestError("Dữ liệu không hợp lệ!");
    error.errors = formattedErrors;

    return next(error);
  };
};

export const userIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID người dùng không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID người dùng phải là số nguyên dương"),
];

export const createUserRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên người dùng không được để trống")
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên người dùng phải từ 2 đến 50 ký tự"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng")
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
        "Phải cung cấp ít nhất một trường để cập nhật: name hoặc email",
      );
    }

    return true;
  }),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Tên người dùng không được để trống")
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên người dùng phải từ 2 đến 50 ký tự"),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .normalizeEmail(),
];

export const registerRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên không được để trống")
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên phải từ 2 đến 50 ký tự"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Mật khẩu không được để trống")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có tối thiểu 6 ký tự"),
];

export const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Mật khẩu không được để trống"),
];

export const classIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID class không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID class phải là số nguyên dương"),
];

export const createClassRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên class không được để trống")
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên class phải từ 2 đến 100 ký tự"),

  body("description").optional().trim(),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày bắt đầu không đúng định dạng"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày kết thúc không đúng định dạng"),

  body("mentorId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID mentor phải là số nguyên dương"),
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
      throw new Error("Phải cung cấp ít nhất một trường để cập nhật class");
    }

    return true;
  }),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Tên class không được để trống")
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên class phải từ 2 đến 100 ký tự"),

  body("description").optional().trim(),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày bắt đầu không đúng định dạng"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày kết thúc không đúng định dạng"),

  body("mentorId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID mentor phải là số nguyên dương"),
];

export const memberIdParamRules = [
  param("memberId")
    .trim()
    .notEmpty()
    .withMessage("ID thành viên không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID thành viên phải là số nguyên dương"),
];

export const addClassMemberRules = [
  body("memberId")
    .notEmpty()
    .withMessage("ID thành viên không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID thành viên phải là số nguyên dương"),
];

export const assignMentorRules = [
  body("mentorId")
    .notEmpty()
    .withMessage("ID mentor không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID mentor phải là số nguyên dương"),
];

export const createLessonRules = [
  body("title")
    .notEmpty()
    .withMessage("Tên lesson không được để trống")
    .isString()
    .withMessage("Tên lesson phải là chuỗi"),

  body("content")
    .notEmpty()
    .withMessage("Nội dung lesson không được để trống")
    .isString()
    .withMessage("Nội dung lesson phải là chuỗi"),

  body("lessonOrder")
    .notEmpty()
    .withMessage("Thứ tự lesson không được để trống")
    .isInt({ min: 0 })
    .withMessage("Thứ tự lesson phải là số nguyên >= 0"),
];

export const lessonIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID lesson không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID lesson phải là số nguyên dương"),
];

export const updateLessonRules = [
  body().custom((value, { req }) => {
    const allowedFields = ["title", "content", "lessonOrder"];

    const hasAllowedField = Object.keys(req.body).some((key) =>
      allowedFields.includes(key),
    );

    if (!hasAllowedField) {
      throw new Error("Phải cung cấp ít nhất một trường để cập nhật lesson");
    }

    return true;
  }),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Tên lesson không được để trống")
    .isString()
    .withMessage("Tên lesson phải là chuỗi"),

  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nội dung lesson không được để trống")
    .isString()
    .withMessage("Nội dung lesson phải là chuỗi"),

  body("lessonOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Thứ tự lesson phải là số nguyên >= 0"),
];

export const assignmentIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID assignment không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID assignment phải là số nguyên dương"),
];

export const createAssignmentRules = [
  body("title")
    .notEmpty()
    .withMessage("Tên assignment không được để trống")
    .isString()
    .withMessage("Tên assignment phải là chuỗi"),

  body("description")
    .optional()
    .isString()
    .withMessage("Mô tả assignment phải là chuỗi"),

  body("deadline")
    .notEmpty()
    .withMessage("Deadline không được để trống")
    .isISO8601()
    .withMessage("Deadline phải có định dạng ngày giờ hợp lệ"),

  body("maximumScore")
    .notEmpty()
    .withMessage("Điểm tối đa không được để trống")
    .isFloat({ min: 0.01 })
    .withMessage("Điểm tối đa phải lớn hơn 0"),
];

export const updateAssignmentRules = [
  body().custom((value, { req }) => {
    const allowedFields = ["title", "description", "deadline", "maximumScore"];

    const hasAllowedField = Object.keys(req.body).some((key) =>
      allowedFields.includes(key),
    );

    if (!hasAllowedField) {
      throw new Error(
        "Phải cung cấp ít nhất một trường để cập nhật assignment",
      );
    }

    return true;
  }),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Tên assignment không được để trống")
    .isString()
    .withMessage("Tên assignment phải là chuỗi"),

  body("description")
    .optional()
    .isString()
    .withMessage("Mô tả assignment phải là chuỗi"),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline phải có định dạng ngày giờ hợp lệ"),

  body("maximumScore")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Điểm tối đa phải lớn hơn 0"),
];

export const submissionIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID bài nộp không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID bài nộp phải là số nguyên dương"),
];

export const submitAssignmentRules = [
  body().custom((value, { req }) => {
    const allowedFields = ["content", "repositoryUrl"];

    const hasAllowedField = Object.keys(req.body).some(
      (key) =>
        allowedFields.includes(key) &&
        req.body[key] !== undefined &&
        String(req.body[key]).trim() !== "",
    );

    if (!hasAllowedField) {
      throw new Error(
        "Phải cung cấp ít nhất nội dung bài làm (content) hoặc link bài nộp (repositoryUrl)",
      );
    }

    return true;
  }),

  body("content")
    .optional()
    .trim()
    .isString()
    .withMessage("Nội dung bài nộp phải là chuỗi"),

  body("repositoryUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Link repository không đúng định dạng URL"),
];

export const reviewSubmissionRules = [
  body("score")
    .notEmpty()
    .withMessage("Điểm số không được để trống")
    .isFloat({ min: 0 })
    .withMessage("Điểm số phải là số lớn hơn hoặc bằng 0"),

  body("feedback")
    .optional()
    .trim()
    .isString()
    .withMessage("Nhận xét phải là chuỗi"),
];
