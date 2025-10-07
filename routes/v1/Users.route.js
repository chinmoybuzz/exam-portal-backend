const express = require("express");
const router = express.Router();
const { uploadBuffer } = require("../../utils/multer");
const AuthController = require("../../controller/user.controller");
const { verifyJWT } = require("../../middleware/authMiddleware");
router.route("/list").get(verifyJWT, AuthController.UserList);
router.route("/add").post(uploadBuffer.any(), verifyJWT, AuthController.UserAdd);

module.exports = router;
