const AuthService = require("../services/auth.services");

// Login Controller
const login = async (req, res) => {
  try {
    const userAgent = req.headers["user-agent"];
    const result = await AuthService.login({ ...req.body, userAgent });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }
};

// Signup Controller
const signup = async (req, res) => {
  try {
    const image = req.files?.filter((img) => img.fieldname.startsWith("image")) || [];
    const result = await AuthService.signUp({ ...req.body, image });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }
};

//refresh-token
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.headers["x-refresh-token"];
    const result = await AuthService.refreshAccessToken({
      refreshToken,
    });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }
};

module.exports = { login, signup, refreshAccessToken };
