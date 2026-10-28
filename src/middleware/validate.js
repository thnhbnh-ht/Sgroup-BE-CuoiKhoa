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

  body("age")
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage("Tuổi phải là số nguyên từ 1 đến 120"),
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
