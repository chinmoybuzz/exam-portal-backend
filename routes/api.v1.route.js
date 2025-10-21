const express = require("express");
const router = express.Router();

router.use("/auth", require("../routes/v1/Auth.route"));
router.use("/dashboard", require("../routes/v1/Dashboard.route"));
router.use("/products", require("../routes/v1/Products.route"));
router.use("/questions", require("../routes/v1/questions.route"));
router.use("/users", require("../routes/v1/Users.route"));
router.use("/role", require("../routes/v1/Role.route"));
module.exports = router;
