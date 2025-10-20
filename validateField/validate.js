const { body, validationResult } = require("express-validator");
const { createResponse } = require("../utils/response");

exports.validateSignup = [
  body("name").notEmpty().withMessage("Name is required").isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),

  body("email").isEmail().withMessage("Invalid email address"),

  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = {};
      errors.array().forEach((err) => {
        if (!formattedErrors[err.path]) {
          formattedErrors[err.path] = err.msg;
        }
      });

      return res.status(400).json(
        createResponse({
          status: 400,
          success: false,
          message: "Validation error",
          data: formattedErrors,
        })
      );
    }
    next();
  },
];

exports.validateLogin = [
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Please enter a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = {};
      errors.array().forEach((err) => {
        console.log(err);
        if (!formattedErrors["error"]) {
          formattedErrors["error"] = "Please enter valid credentials";
        }
      });

      return res.status(400).json(
        createResponse({
          status: 400,
          success: false,
          message: "Validation error",
          data: formattedErrors,
        })
      );
    }
    next();
  },
];
exports.validateRole = [
  body("role").notEmpty().withMessage("role is required").isEmail().withMessage("Please enter a valid role"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = {};
      errors.array().forEach((err) => {
        console.log(err);
        if (!formattedErrors["error"]) {
          formattedErrors["error"] = "Please enter valid credentials";
        }
      });

      return res.status(400).json(
        createResponse({
          status: 400,
          success: false,
          message: "Validation error",
          data: formattedErrors,
        })
      );
    }
    next();
  },
];
