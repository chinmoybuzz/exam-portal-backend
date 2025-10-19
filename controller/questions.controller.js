const QuestionService = require("../services/question.service");

const QuestionList = async (req, res) => {
  try {
    const result = await QuestionService.QuestionList({ ...req.query, ...req.params });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }
};

const QuestionAdd = async (req, res) => {
  try {
    const result = await QuestionService.QuestionAdd({ ...req.body });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }
};

module.exports = { QuestionAdd, QuestionList };
