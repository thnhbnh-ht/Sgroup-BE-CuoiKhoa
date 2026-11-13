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

const validateAllowedUpdateFields = (allowedFields, entityName) => {
  return body().custom((value, { req }) => {
    const keys = Object.keys(req.body || {});

    if (keys.length === 0) {
      throw new Error(
        `Phải cung cấp ít nhất một trường để cập nhật ${entityName}`,
      );
    }

    const invalidFields = keys.filter((key) => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
      throw new Error(
        `Các trường không hợp lệ: ${invalidFields.join(", ")}. Chỉ chấp nhận: ${allowedFields.join(", ")}`,
      );
    }

    return true;
  });
};

const createIdParamRule = (paramName, label) => [
  param(paramName)
    .trim()
    .notEmpty()
    .withMessage(`${label} không được để trống`)
    .bail()
    .isInt({ min: 1 })
    .withMessage(`${label} phải là số nguyên dương`),
];

export const userIdParamRules = createIdParamRule("id", "ID người dùng");
export const classIdParamRules = createIdParamRule("id", "ID lớp học");
export const memberIdParamRules = createIdParamRule(
  "memberId",
  "ID thành viên",
);
export const lessonIdParamRules = createIdParamRule("id", "ID bài học");
export const assignmentIdParamRules = createIdParamRule("id", "ID bài tập");
export const submissionIdParamRules = createIdParamRule("id", "ID bài nộp");

export const registerRules = [
  body("name")
    .isString()
    .withMessage("Tên phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tên không được để trống")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên phải từ 2 đến 50 ký tự")
    .bail()
    .matches(/^[\p{L}\p{M}\s.'-]+$/u)
    .withMessage(
      "Tên chỉ được chứa chữ cái tiếng Việt/quốc tế, khoảng trắng, dấu chấm, nháy và gạch ngang",
    ),

  body("email")
    .isString()
    .withMessage("Email phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .bail()
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .bail()
    .isLength({ max: 254 })
    .withMessage("Email không được vượt quá 254 ký tự")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Mật khẩu phải là chuỗi ký tự")
    .bail()
    .notEmpty()
    .withMessage("Mật khẩu không được để trống")
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage("Mật khẩu phải từ 8 đến 72 ký tự")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa")
    .bail()
    .matches(/[a-z]/)
    .withMessage("Mật khẩu phải chứa ít nhất 1 chữ thường")
    .bail()
    .matches(/[0-9]/)
    .withMessage("Mật khẩu phải chứa ít nhất 1 chữ số")
    .bail()
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt"),
];

export const loginRules = [
  body("email")
    .isString()
    .withMessage("Email phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .bail()
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Mật khẩu phải là chuỗi ký tự")
    .bail()
    .notEmpty()
    .withMessage("Mật khẩu không được để trống"),
];

export const refreshTokenRules = [
  body().custom((value, { req }) => {
    const token = req.body?.refreshToken || req.body?.refresh_token;
    if (!token || typeof token !== "string" || token.trim() === "") {
      throw new Error("Refresh token không được để trống");
    }
    return true;
  }),
];

export const createUserRules = [
  body("name")
    .isString()
    .withMessage("Tên người dùng phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tên người dùng không được để trống")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên người dùng phải từ 2 đến 50 ký tự")
    .bail()
    .matches(/^[\p{L}\p{M}\s.'-]+$/u)
    .withMessage(
      "Tên người dùng chỉ được chứa chữ cái, khoảng trắng và dấu gạch nối",
    ),

  body("email")
    .isString()
    .withMessage("Email phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .bail()
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .bail()
    .isLength({ max: 254 })
    .withMessage("Email không được vượt quá 254 ký tự")
    .normalizeEmail(),
];

export const updateUserRules = [
  validateAllowedUpdateFields(["name", "email"], "người dùng"),

  body("name")
    .optional()
    .isString()
    .withMessage("Tên người dùng phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tên người dùng không được để trống")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên người dùng phải từ 2 đến 50 ký tự")
    .bail()
    .matches(/^[\p{L}\p{M}\s.'-]+$/u)
    .withMessage(
      "Tên người dùng chỉ được chứa chữ cái, khoảng trắng và dấu gạch nối",
    ),

  body("email")
    .optional()
    .isString()
    .withMessage("Email phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .bail()
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .bail()
    .isLength({ max: 254 })
    .withMessage("Email không được vượt quá 254 ký tự")
    .normalizeEmail(),
];

export const createClassRules = [
  body("name")
    .isString()
    .withMessage("Tên lớp học phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tên lớp học không được để trống")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên lớp học phải từ 2 đến 100 ký tự"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Mô tả lớp học phải là chuỗi ký tự")
    .bail()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Mô tả không được vượt quá 1000 ký tự"),

  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Ngày bắt đầu không đúng định dạng ISO8601"),

  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Ngày kết thúc không đúng định dạng ISO8601")
    .bail()
    .custom((endDate, { req }) => {
      if (
        req.body?.startDate &&
        new Date(endDate) <= new Date(req.body.startDate)
      ) {
        throw new Error("Ngày kết thúc phải diễn ra sau ngày bắt đầu");
      }
      return true;
    }),

  body("mentorId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("ID mentor phải là số nguyên dương"),
];

export const updateClassRules = [
  validateAllowedUpdateFields(
    ["name", "description", "startDate", "endDate", "mentorId"],
    "lớp học",
  ),

  body("name")
    .optional()
    .isString()
    .withMessage("Tên lớp học phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tên lớp học không được để trống")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên lớp học phải từ 2 đến 100 ký tự"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Mô tả lớp học phải là chuỗi ký tự")
    .bail()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Mô tả không được vượt quá 1000 ký tự"),

  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Ngày bắt đầu không đúng định dạng ISO8601"),

  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Ngày kết thúc không đúng định dạng ISO8601")
    .bail()
    .custom((endDate, { req }) => {
      if (
        req.body?.startDate &&
        new Date(endDate) <= new Date(req.body.startDate)
      ) {
        throw new Error("Ngày kết thúc phải diễn ra sau ngày bắt đầu");
      }
      return true;
    }),

  body("mentorId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("ID mentor phải là số nguyên dương"),
];

export const addClassMemberRules = [
  body("memberId")
    .notEmpty()
    .withMessage("ID thành viên không được để trống")
    .bail()
    .isInt({ min: 1 })
    .withMessage("ID thành viên phải là số nguyên dương"),
];

export const assignMentorRules = [
  body("mentorId")
    .notEmpty()
    .withMessage("ID mentor không được để trống")
    .bail()
    .isInt({ min: 1 })
    .withMessage("ID mentor phải là số nguyên dương"),
];

export const createLessonRules = [
  body("title")
    .isString()
    .withMessage("Tên bài học phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tên bài học không được để trống")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Tên bài học phải từ 2 đến 200 ký tự"),

  body("content")
    .isString()
    .withMessage("Nội dung bài học phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Nội dung bài học không được để trống")
    .bail()
    .isLength({ max: 50000 })
    .withMessage("Nội dung bài học không được vượt quá 50000 ký tự"),

  body("lessonOrder")
    .notEmpty()
    .withMessage("Thứ tự bài học không được để trống")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Thứ tự bài học phải là số nguyên không âm (>= 0)"),
];

export const updateLessonRules = [
  validateAllowedUpdateFields(["title", "content", "lessonOrder"], "bài học"),

  body("title")
    .optional()
    .isString()
    .withMessage("Tên bài học phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tên bài học không được để trống")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Tên bài học phải từ 2 đến 200 ký tự"),

  body("content")
    .optional()
    .isString()
    .withMessage("Nội dung bài học phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Nội dung bài học không được để trống")
    .bail()
    .isLength({ max: 50000 })
    .withMessage("Nội dung bài học không được vượt quá 50000 ký tự"),

  body("lessonOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Thứ tự bài học phải là số nguyên không âm (>= 0)"),
];

export const createAssignmentRules = [
  body("title")
    .isString()
    .withMessage("Tiêu đề bài tập phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề bài tập không được để trống")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Tiêu đề bài tập phải từ 2 đến 200 ký tự"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Mô tả bài tập phải là chuỗi ký tự")
    .bail()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Mô tả bài tập không được vượt quá 5000 ký tự"),

  body("deadline")
    .notEmpty()
    .withMessage("Deadline không được để trống")
    .bail()
    .isISO8601()
    .withMessage("Deadline phải có định dạng ngày giờ ISO8601 hợp lệ"),

  body("maximumScore")
    .notEmpty()
    .withMessage("Điểm tối đa không được để trống")
    .bail()
    .isInt({ min: 1, max: 100 })
    .withMessage("Điểm tối đa phải là số nguyên từ 1 đến 100"),
];

export const updateAssignmentRules = [
  validateAllowedUpdateFields(
    ["title", "description", "deadline", "maximumScore"],
    "bài tập",
  ),

  body("title")
    .optional()
    .isString()
    .withMessage("Tiêu đề bài tập phải là chuỗi ký tự")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề bài tập không được để trống")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Tiêu đề bài tập phải từ 2 đến 200 ký tự"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Mô tả bài tập phải là chuỗi ký tự")
    .bail()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Mô tả bài tập không được vượt quá 5000 ký tự"),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline phải có định dạng ngày giờ ISO8601 hợp lệ"),

  body("maximumScore")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Điểm tối đa phải là số nguyên từ 1 đến 100"),
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
        "Phải cung cấp ít nhất nội dung bài làm (content), link bài nộp (repositoryUrl) hoặc file đính kèm",
      );
    }

    return true;
  }),

  body("content")
    .optional({ nullable: true })
    .isString()
    .withMessage("Nội dung bài nộp phải là chuỗi ký tự")
    .bail()
    .trim()
    .isLength({ max: 10000 })
    .withMessage("Nội dung bài nộp không được vượt quá 10000 ký tự"),

  body("repositoryUrl")
    .optional({ nullable: true })
    .isString()
    .withMessage("Link bài nộp phải là chuỗi ký tự")
    .bail()
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage(
      "Link repository phải là URL hợp lệ bắt đầu bằng http:// hoặc https://",
    )
    .bail()
    .isLength({ max: 500 })
    .withMessage("Link repository không được vượt quá 500 ký tự"),
];

export const reviewSubmissionRules = [
  body("score")
    .notEmpty()
    .withMessage("Điểm số không được để trống")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Điểm số phải là số nguyên lớn hơn hoặc bằng 0"),

  body("feedback")
    .optional({ nullable: true })
    .isString()
    .withMessage("Nhận xét phải là chuỗi ký tự")
    .bail()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Nhận xét không được vượt quá 2000 ký tự"),
];
