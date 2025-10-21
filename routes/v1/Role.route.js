const express = require("express");
const router = express.Router();
const { uploadBuffer } = require("../../utils/multer");
const RoleController = require("../../controller/role.controller");
const { validateRole } = require("../../validateField/validate");

const { verifyJWT } = require("../../middleware/authMiddleware");
router.route("/list").get(verifyJWT, RoleController.RoleList);
router.route("/add").post(uploadBuffer.any(), validateRole, verifyJWT, RoleController.RoleAdd);
router.route("/status-change").put(verifyJWT);
module.exports = router;
