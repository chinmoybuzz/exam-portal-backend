const express = require("express");
const router = express.Router();
const { uploadBuffer } = require("../../utils/multer");
const QuestionController = require("../../controller/questions.controller");

router.route("/list").get(QuestionController.QuestionList);
router.route("/add").post(uploadBuffer.any(), QuestionController.QuestionAdd);

module.exports = router;
